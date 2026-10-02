import { CloudUpload, KeyRound, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { SyncIndicator } from "@/components/auth/SyncIndicator";
import { useSignOut } from "@/components/auth/useSignOut";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { supabase } from "@/lib/supabase";
import { session, useSessionStore } from "@/store/cloud/session";
import { useSyncStore } from "@/store/cloud/sync";
import { useUIStore } from "@/store/uiStore";

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

export function AccountSection() {
  const phase = useSessionStore((s) => s.phase);
  const user = useSessionStore((s) => s.user);
  const lastSavedAt = useSyncStore((s) => s.lastSavedAt);
  const toast = useUIStore((s) => s.toast);
  const navigate = useNavigate();
  const { signOut, busy, dialog } = useSignOut();
  const [sending, setSending] = useState(false);

  if (phase === "local-only") return null;

  if (phase === "guest") {
    return (
      <Card>
        <CardHeader title="Account" description="You're using guest mode. Your data is stored only in this browser." />
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <CloudUpload className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="flex-1 text-sm text-muted">Create a free account to keep your data safe and use it on any device. You can copy this browser's data into it.</p>
          <Button
            variant="primary"
            onClick={() => {
              session.leaveGuestMode();
              navigate("/login");
            }}
          >
            Sign in or create account
          </Button>
        </div>
      </Card>
    );
  }

  if (!user) return null;

  const sendReset = async () => {
    if (!supabase) return;
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/reset-password` });
    setSending(false);
    toast(error ? error.message : `Password reset link sent to ${user.email}`, error ? "error" : "success");
  };

  return (
    <Card>
      <CardHeader title="Account" description="Your data is saved to your account and synced across devices." />
      <div className="space-y-4 p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Signed in as</dt>
            <dd className="mt-0.5 truncate font-medium text-fg">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Sync</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-x-2">
              <SyncIndicator />
              {lastSavedAt && <span className="text-xs text-subtle">Last saved {timeFormat.format(lastSavedAt)}</span>}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button icon={KeyRound} onClick={() => void sendReset()} disabled={sending}>
            {sending ? "Sending…" : "Change password"}
          </Button>
          <Button icon={LogOut} onClick={() => void signOut()} disabled={busy}>
            Sign out
          </Button>
        </div>
      </div>
      {dialog}
    </Card>
  );
}
