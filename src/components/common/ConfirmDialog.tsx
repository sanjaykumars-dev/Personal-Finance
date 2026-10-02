import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  tone = "danger",
  onConfirm,
  onCancel,
  confirmDisabled,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant={tone} onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone === "danger" && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-expense-soft text-expense">
            <TriangleAlert className="size-4.5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-3 text-sm text-muted">
          <div>{message}</div>
          {children}
        </div>
      </div>
    </Modal>
  );
}
