import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

type Tone = "primary" | "income" | "expense" | "warning";

const ICON_TONES: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  warning: "bg-warning-soft text-warning",
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
  footnote?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "primary", footnote }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] font-medium text-muted sm:text-sm">{label}</p>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl sm:size-9", ICON_TONES[tone])}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <p className="tabular mt-3 truncate text-xl font-semibold tracking-tight text-fg sm:text-2xl">{value}</p>
      {footnote && <p className="mt-1 truncate text-xs text-subtle">{footnote}</p>}
    </div>
  );
}
