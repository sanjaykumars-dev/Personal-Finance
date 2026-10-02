import type { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { createEmptyData, createSampleData } from "@/data/sampleData";
import { isCloudEnabled, supabase } from "@/lib/supabase";
import type { AppData } from "@/types";
import { getAppData, replaceAppData } from "../actions";
import { useBudgetStore } from "../budgetStore";
import { useCategoryStore } from "../categoryStore";
import { useGoalStore } from "../goalStore";
import { setLocalPersistence } from "../persistence";
import { useSettingsStore } from "../settingsStore";
import { useTransactionStore } from "../transactionStore";
import { toast } from "../uiStore";
import { fetchRemoteData } from "./remote";
import { pushChanges, syncEngine } from "./sync";

/**
 * - local-only: cloud not configured, app works exactly as before
 * - guest:      cloud configured, user chose "continue without an account"
 * - signed-out: show the login page
 * - loading / needs-setup / ready / error: signed in, with account data in various states
 */
export type SessionPhase = "initializing" | "local-only" | "guest" | "signed-out" | "loading" | "needs-setup" | "ready" | "error";

export type SetupChoice = "local" | "sample" | "empty";

interface SessionState {
  phase: SessionPhase;
  user: { id: string; email: string } | null;
  error: string | null;
  /** Snapshot of this browser's guest data, offered when setting up a new account. */
  guestData: AppData | null;
}

export const useSessionStore = create<SessionState>()(() => ({
  phase: isCloudEnabled ? "initializing" : "local-only",
  user: null,
  error: null,
  guestData: null,
}));

const GUEST_FLAG = "pfd:mode";

function readGuestFlag(): boolean {
  try {
    return localStorage.getItem(GUEST_FLAG) === "guest";
  } catch {
    return false;
  }
}

function writeGuestFlag(on: boolean): void {
  try {
    if (on) localStorage.setItem(GUEST_FLAG, "guest");
    else localStorage.removeItem(GUEST_FLAG);
  } catch {
    // Storage blocked: guest mode just won't be remembered.
  }
}

function messageOf(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Something went wrong.";
}

/** Restores the guest data set from localStorage into the stores. */
async function restoreGuestData(): Promise<void> {
  setLocalPersistence(true);
  await Promise.all([
    useCategoryStore.persist.rehydrate(),
    useTransactionStore.persist.rehydrate(),
    useBudgetStore.persist.rehydrate(),
    useGoalStore.persist.rehydrate(),
    useSettingsStore.persist.rehydrate(),
  ]);
}

let loadToken = 0;

async function enterAccount(user: User): Promise<void> {
  const token = ++loadToken;
  const state = useSessionStore.getState();
  // While signed in, account data must never be written to the guest's local keys.
  // The stores still hold the guest data at this point; keep a copy for setup.
  const guestData = state.user ? state.guestData : getAppData();
  setLocalPersistence(false);
  writeGuestFlag(false);
  useSessionStore.setState({ phase: "loading", user: { id: user.id, email: user.email ?? "" }, error: null, guestData });

  try {
    const remote = await fetchRemoteData();
    if (token !== loadToken) return;
    if (remote.kind === "empty") {
      useSessionStore.setState({ phase: "needs-setup" });
      return;
    }
    replaceAppData(remote.data);
    syncEngine.start(user.id, getAppData());
    useSessionStore.setState({ phase: "ready" });
    if (remote.skipped > 0) toast(`${remote.skipped} invalid record${remote.skipped === 1 ? " was" : "s were"} skipped while loading`, "info");
  } catch (error) {
    if (token !== loadToken) return;
    console.error("[session] Failed to load account data", error);
    useSessionStore.setState({ phase: "error", error: messageOf(error) });
  }
}

async function exitAccount(): Promise<void> {
  loadToken++;
  syncEngine.stop();
  await restoreGuestData();
  useSessionStore.setState({ phase: "signed-out", user: null, error: null, guestData: null });
}

let initialized = false;

/** Subscribes to Supabase auth once, at startup. */
export function initSession(): void {
  if (initialized || !supabase) return;
  initialized = true;
  supabase.auth.onAuthStateChange((event, session) => {
    // Supabase advises against awaiting its own calls inside this callback.
    window.setTimeout(() => {
      const current = useSessionStore.getState();
      if (session?.user) {
        if (current.user?.id !== session.user.id) void enterAccount(session.user);
        else if (event === "USER_UPDATED") useSessionStore.setState({ user: { id: session.user.id, email: session.user.email ?? "" } });
      } else if (event === "SIGNED_OUT" && current.user) {
        void exitAccount();
      } else if (current.phase === "initializing") {
        useSessionStore.setState({ phase: readGuestFlag() ? "guest" : "signed-out" });
      }
    }, 0);
  });
}

export const session = {
  continueAsGuest(): void {
    writeGuestFlag(true);
    useSessionStore.setState({ phase: "guest" });
  },

  /** From guest mode back to the login page. Guest data stays in this browser. */
  leaveGuestMode(): void {
    writeGuestFlag(false);
    useSessionStore.setState({ phase: "signed-out" });
  },

  async retryLoad(): Promise<void> {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      useSessionStore.setState({ user: null });
      await enterAccount(data.user);
    }
  },

  /** First sign-in: seed the account, upload it, then start syncing. */
  async completeSetup(choice: SetupChoice): Promise<void> {
    const { user, guestData } = useSessionStore.getState();
    if (!user) return;
    const data =
      choice === "local" && guestData
        ? guestData
        : choice === "sample"
          ? createSampleData()
          : { ...createEmptyData(), settings: { ...createEmptyData().settings, theme: useSettingsStore.getState().theme } };
    useSessionStore.setState({ phase: "loading" });
    try {
      await pushChanges(null, data, user.id);
      replaceAppData(data);
      syncEngine.start(user.id, getAppData());
      useSessionStore.setState({ phase: "ready" });
      toast(choice === "local" ? "Your data was copied to your account" : "Your account is ready");
    } catch (error) {
      console.error("[session] Account setup failed", error);
      useSessionStore.setState({ phase: "needs-setup" });
      toast(`Couldn't set up your account: ${messageOf(error)}`, "error");
    }
  },

  /**
   * Saves pending changes, then signs out. Returns false (without signing out)
   * if changes couldn't be saved and `force` isn't set.
   */
  async signOut(force = false): Promise<boolean> {
    if (!supabase) return true;
    if (!force) {
      const saved = await syncEngine.flushNow();
      if (!saved) return false;
    }
    // "local" signs out this browser only, not the user's other devices.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      toast(messageOf(error), "error");
      return false;
    }
    return true;
  },
};
