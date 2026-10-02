import { CategoryIcon } from "@/components/common/CategoryIcon";
import { ProgressBar } from "@/components/common/ProgressBar";
import { useCategories } from "@/hooks/useCategories";
import { useMoney } from "@/hooks/useMoney";
import type { Budget } from "@/types";
import { cn } from "@/utils/cn";
import type { BudgetStatus, BudgetUsage } from "@/utils/finance";

export const STATUS_TONE: Record<BudgetStatus, "primary" | "warning" | "expense"> = {
  ok: "primary",
  warning: "warning",
  exceeded: "expense",
};

export const STATUS_LABEL: Record<BudgetStatus, string> = {
  ok: "On track",
  warning: "Near limit",
  exceeded: "Over budget",
};

const BADGE: Record<BudgetStatus, string> = {
  ok: "bg-primary-soft text-primary",
  warning: "bg-warning-soft text-warning",
  exceeded: "bg-expense-soft text-expense",
};

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", BADGE[status])}>{STATUS_LABEL[status]}</span>;
}

/** Compact row used in the dashboard overview. */
export function BudgetProgressRow({ budget, usage }: { budget: Budget; usage: BudgetUsage }) {
  const { byId, color, name } = useCategories();
  const money = useMoney();
  const category = byId.get(budget.categoryId);
  return (
    <li className="flex items-center gap-3">
      <CategoryIcon icon={category?.icon ?? "tag"} color={color(budget.categoryId)} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate font-medium text-fg">{name(budget.categoryId)}</span>
          <span className="tabular shrink-0 text-xs text-muted">
            <span className={cn("font-medium", usage.status === "exceeded" ? "text-expense" : "text-fg")}>{money.format(usage.spent)}</span>
            {" / "}
            {money.format(usage.limit)}
          </span>
        </div>
        <ProgressBar
          value={usage.percent}
          tone={STATUS_TONE[usage.status]}
          size="sm"
          className="mt-1.5"
          label={`${name(budget.categoryId)} budget used`}
        />
      </div>
    </li>
  );
}
