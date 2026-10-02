import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { AppData, Category } from "@/types";
import { getAppData } from "../actions";
import { useBudgetStore } from "../budgetStore";
import { useCategoryStore } from "../categoryStore";
import { useGoalStore } from "../goalStore";
import { useSettingsStore } from "../settingsStore";
import { useTransactionStore } from "../transactionStore";
import { toast } from "../uiStore";
import { settingsToRow, toRow } from "./mappers";

export type SyncStatus = "idle" | "pending" | "saving" | "saved" | "error" | "offline";

interface SyncState {
  status: SyncStatus;
  lastSavedAt: number | null;
}

/** Observable sync status for the UI ("Saving…", "All changes saved", …). */
export const useSyncStore = create<SyncState>()(() => ({ status: "idle", lastSavedAt: null }));

const setStatus = (status: SyncStatus) =>
  useSyncStore.setState(status === "saved" ? { status, lastSavedAt: Date.now() } : { status });

const DEBOUNCE_MS = 700;
const MAX_RETRY_MS = 30_000;
const CHUNK = 500;

type Row = { id: string } & Record<string, unknown>;
type Table = "categories" | "transactions" | "budgets" | "goals";

/** Key-order-independent serialisation, so equal records always compare equal. */
function stableKey(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableKey).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableKey((value as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Rows for every table. Categories carry their list position so order (and chart colours) survive a reload. */
function rowsFor(data: AppData, userId: string): Record<Table, Row[]> {
  return {
    categories: data.categories.map((c: Category, index) => ({ ...toRow.categories(c, userId), position: index })),
    transactions: data.transactions.map((t) => toRow.transactions(t, userId)),
    budgets: data.budgets.map((b) => toRow.budgets(b, userId)),
    goals: data.goals.map((g) => toRow.goals(g, userId)),
  };
}

function diffRows(prev: Row[], next: Row[]): { upserts: Row[]; deletes: string[] } {
  const before = new Map(prev.map((r) => [r.id, stableKey(r)]));
  const nextIds = new Set(next.map((r) => r.id));
  return {
    upserts: next.filter((r) => before.get(r.id) !== stableKey(r)),
    deletes: prev.filter((r) => !nextIds.has(r.id)).map((r) => r.id),
  };
}

function chunks<T>(items: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function settingsKey(data: AppData): string {
  const { updated_at: _ignored, ...row } = settingsToRow(data.settings, "");
  return stableKey(row);
}

/**
 * Writes the difference between two snapshots. Upserts run before deletes,
 * so a category's transactions are moved before the category disappears.
 * `prev === null` means "nothing on the server yet" (first upload).
 */
export async function pushChanges(prev: AppData | null, next: AppData, userId: string): Promise<void> {
  if (!supabase) throw new Error("Cloud sync is not configured.");
  const before = prev ? rowsFor(prev, userId) : { categories: [], transactions: [], budgets: [], goals: [] };
  const after = rowsFor(next, userId);
  const tables: Table[] = ["categories", "transactions", "budgets", "goals"];
  const diffs = Object.fromEntries(tables.map((t) => [t, diffRows(before[t], after[t])])) as Record<Table, ReturnType<typeof diffRows>>;

  for (const table of tables) {
    for (const batch of chunks(diffs[table].upserts)) {
      const { error } = await supabase.from(table).upsert(batch, { onConflict: "user_id,id" });
      if (error) throw error;
    }
  }
  if (!prev || settingsKey(prev) !== settingsKey(next)) {
    const { error } = await supabase.from("settings").upsert(settingsToRow(next.settings, userId), { onConflict: "user_id" });
    if (error) throw error;
  }
  for (const table of ["transactions", "budgets", "goals", "categories"] as const) {
    for (const ids of chunks(diffs[table].deletes, 200)) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId).in("id", ids);
      if (error) throw error;
    }
  }
}

// ── Engine ────────────────────────────────────────────────────────────────

let userId: string | null = null;
let synced: AppData | null = null;
let timer: number | undefined;
let inFlight: Promise<boolean> | null = null;
let dirtyDuringFlight = false;
let retryMs = 2000;
let errorToastShown = false;
let unsubscribers: (() => void)[] = [];

function hasUnsyncedChanges(): boolean {
  if (!userId || !synced) return false;
  const a = rowsFor(synced, userId);
  const b = rowsFor(getAppData(), userId);
  return stableKey(a) !== stableKey(b) || settingsKey(synced) !== settingsKey(getAppData());
}

function schedule(delay = DEBOUNCE_MS): void {
  if (!userId) return;
  window.clearTimeout(timer);
  if (useSyncStore.getState().status !== "error") setStatus(navigator.onLine ? "pending" : "offline");
  timer = window.setTimeout(() => void flush(), delay);
}

async function flush(): Promise<boolean> {
  if (!userId || !synced) return true;
  if (inFlight) {
    dirtyDuringFlight = true;
    return inFlight;
  }
  window.clearTimeout(timer);
  timer = undefined;
  const owner = userId;
  const next = getAppData();
  setStatus("saving");

  inFlight = (async () => {
    try {
      await pushChanges(synced, next, owner);
      if (owner !== userId) return true; // signed out mid-flight
      synced = next;
      retryMs = 2000;
      errorToastShown = false;
      setStatus(hasUnsyncedChanges() ? "pending" : "saved");
      return true;
    } catch (error) {
      if (owner !== userId) return false;
      console.warn("[sync] Save failed, will retry", error);
      setStatus(navigator.onLine ? "error" : "offline");
      if (!errorToastShown && navigator.onLine) {
        toast("Couldn't save to your account. Retrying…", "error");
        errorToastShown = true;
      }
      timer = window.setTimeout(() => void flush(), retryMs);
      retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
      return false;
    } finally {
      inFlight = null;
      if (dirtyDuringFlight && userId) {
        dirtyDuringFlight = false;
        schedule(0);
      }
    }
  })();
  return inFlight;
}

const onOnline = () => {
  if (userId && hasUnsyncedChanges()) void flush();
};

const onBeforeUnload = (event: BeforeUnloadEvent) => {
  if (hasUnsyncedChanges()) {
    void flush();
    event.preventDefault();
  }
};

export const syncEngine = {
  /** Begin syncing for `uid`, treating `snapshot` as what the server already holds. */
  start(uid: string, snapshot: AppData): void {
    this.stop();
    userId = uid;
    synced = snapshot;
    const onChange = () => schedule();
    unsubscribers = [
      useCategoryStore.subscribe(onChange),
      useTransactionStore.subscribe(onChange),
      useBudgetStore.subscribe(onChange),
      useGoalStore.subscribe(onChange),
      useSettingsStore.subscribe(onChange),
    ];
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    setStatus("saved");
  },

  stop(): void {
    unsubscribers.forEach((u) => u());
    unsubscribers = [];
    window.clearTimeout(timer);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("beforeunload", onBeforeUnload);
    userId = null;
    synced = null;
    setStatus("idle");
  },

  /** Saves pending changes immediately. Resolves true when everything is on the server. */
  async flushNow(): Promise<boolean> {
    if (!userId) return true;
    if (inFlight) await inFlight;
    if (!hasUnsyncedChanges()) return true;
    const ok = await flush();
    return ok && !hasUnsyncedChanges();
  },

  hasUnsyncedChanges,
};
