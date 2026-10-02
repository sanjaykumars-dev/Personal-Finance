import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { session } from "@/store/cloud/session";

/**
 * Sign out, saving pending changes first. If they can't be saved, asks
 * before discarding them. Render `dialog` somewhere in the component.
 */
export function useSignOut() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    const done = await session.signOut();
    setBusy(false);
    if (!done) setConfirming(true);
  };

  const dialog = (
    <ConfirmDialog
      open={confirming}
      title="Sign out with unsaved changes?"
      message="Some recent changes couldn't be saved to your account (you may be offline). If you sign out now, they'll be lost."
      confirmLabel="Sign out anyway"
      onConfirm={() => {
        setConfirming(false);
        void session.signOut(true);
      }}
      onCancel={() => setConfirming(false)}
    />
  );

  return { signOut, busy, dialog };
}
