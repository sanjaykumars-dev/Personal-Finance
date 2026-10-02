import { Cloud, CloudAlert, CloudOff, LoaderCircle, type LucideIcon } from "lucide-react";
import { useSyncStore, type SyncStatus } from "@/store/cloud/sync";
import { cn } from "@/utils/cn";

const STATES: Record<SyncStatus, { icon: LucideIcon; label: string; className: string; spin?: boolean }> = {
  idle: { icon: Cloud, label: "Synced", className: "text-subtle" },
  saved: { icon: Cloud, label: "All changes saved", className: "text-subtle" },
  pending: { icon: LoaderCircle, label: "Saving…", className: "text-subtle", spin: true },
  saving: { icon: LoaderCircle, label: "Saving…", className: "text-subtle", spin: true },
  error: { icon: CloudAlert, label: "Couldn't save · retrying", className: "text-expense" },
  offline: { icon: CloudOff, label: "Offline · will sync later", className: "text-warning" },
};

export function SyncIndicator({ compact = false }: { compact?: boolean }) {
  const status = useSyncStore((s) => s.status);
  const { icon: Icon, label, className, spin } = STATES[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)} role="status" aria-live="polite" title={label}>
      <Icon className={cn("size-3.5 shrink-0", spin && "animate-spin")} aria-hidden="true" />
      <span className={compact ? "sr-only" : "truncate"}>{label}</span>
    </span>
  );
}
