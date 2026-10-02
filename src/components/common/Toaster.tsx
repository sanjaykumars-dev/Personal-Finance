import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useEffect } from "react";
import { useUIStore, type Toast } from "@/store/uiStore";
import { cn } from "@/utils/cn";

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const TONES = { success: "text-income", error: "text-expense", info: "text-primary" };
const DURATION_MS = 3500;

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUIStore((s) => s.dismissToast);
  const Icon = ICONS[toast.tone];

  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), toast.tone === "error" ? DURATION_MS * 1.6 : DURATION_MS);
    return () => window.clearTimeout(id);
  }, [toast.id, toast.tone, dismiss]);

  return (
    <div className="animate-toast-in pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-pop sm:w-80">
      <Icon className={cn("mt-0.5 size-4.5 shrink-0", TONES[toast.tone])} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm font-medium text-fg">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="-mr-1 rounded-md p-0.5 text-subtle hover:text-fg"
        aria-label="Dismiss notification"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end lg:bottom-6"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
