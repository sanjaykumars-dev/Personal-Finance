import { HardDrive, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { IconButton } from "@/components/common/Button";
import { session, useSessionStore } from "@/store/cloud/session";
import { useSettingsStore } from "@/store/settingsStore";
import { SyncIndicator } from "./SyncIndicator";
import { useSignOut } from "./useSignOut";

function Avatar({ letter }: { letter: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary" aria-hidden="true">
      {letter.toUpperCase()}
    </span>
  );
}

/** Sidebar footer: who you are and where your data lives. */
export function AccountCard() {
  const phase = useSessionStore((s) => s.phase);
  const user = useSessionStore((s) => s.user);
  const name = useSettingsStore((s) => s.name).trim();
  const navigate = useNavigate();
  const { signOut, busy, dialog } = useSignOut();

  if (phase === "ready" && user) {
    const display = name || user.email;
    return (
      <div className="rounded-xl bg-surface-muted p-3">
        <div className="flex items-center gap-3">
          <Avatar letter={display[0] ?? "U"} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg" title={user.email}>
              {display}
            </p>
            <SyncIndicator />
          </div>
          <IconButton icon={LogOut} label="Sign out" onClick={() => void signOut()} disabled={busy} />
        </div>
        {dialog}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-muted p-3">
      <div className="flex items-center gap-3">
        <Avatar letter={name[0] ?? "Y"} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{name || (phase === "guest" ? "Guest" : "You")}</p>
          <p className="flex items-center gap-1 text-xs text-subtle">
            <HardDrive className="size-3" aria-hidden="true" />
            Stored in this browser
          </p>
        </div>
      </div>
      {phase === "guest" && (
        <button
          type="button"
          onClick={() => {
            session.leaveGuestMode();
            navigate("/login");
          }}
          className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface text-sm font-medium text-fg transition-colors hover:bg-surface-hover"
        >
          <LogIn className="size-3.5" aria-hidden="true" />
          Sign in to sync
        </button>
      )}
    </div>
  );
}
