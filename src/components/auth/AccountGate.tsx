import { CloudOff } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { Button } from "@/components/common/Button";
import { session, useSessionStore } from "@/store/cloud/session";
import { AuthLayout, FullScreenMessage } from "./AuthLayout";
import { SetupAccount } from "./SetupAccount";

/**
 * Decides what the app shell may render. Pages only ever see fully loaded
 * data: guest/local data, or an account's data after it has been fetched.
 */
export function AccountGate({ children }: { children: ReactNode }) {
  const phase = useSessionStore((s) => s.phase);
  const error = useSessionStore((s) => s.error);
  const location = useLocation();

  switch (phase) {
    case "local-only":
    case "guest":
    case "ready":
      return <>{children}</>;
    case "initializing":
      return <FullScreenMessage title="Loading…" />;
    case "loading":
      return <FullScreenMessage title="Loading your data…" />;
    case "signed-out":
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    case "needs-setup":
      return <SetupAccount />;
    case "error":
      return (
        <AuthLayout
          title="Couldn't load your data"
          description="Check your connection. If this keeps happening, the database may not be set up yet (see the README)."
        >
          <div className="flex items-start gap-3 rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">
            <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="primary" className="flex-1" onClick={() => void session.retryLoad()}>
              Try again
            </Button>
            <Button onClick={() => void session.signOut(true)}>Sign out</Button>
          </div>
        </AuthLayout>
      );
  }
}
