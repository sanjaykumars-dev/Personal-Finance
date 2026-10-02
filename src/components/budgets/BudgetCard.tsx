import { Pencil, Trash2, TriangleAlert } from "lucide-react";
import { IconButton } from "@/components/common/Button";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { ProgressBar } from "@/components/common/ProgressBar";
import { useCategories } from "@/hooks/useCategories";
import { useMoney } from "@/hooks/useMoney";
import type { Budget } from "@/types";
import { cn } from "@/utils/cn";
import type { BudgetUsage } from "@/utils/finance";
import { BudgetStatusBadge, STATUS_TONE } from "./BudgetProgress";

interface BudgetCardProps {
  budget: Budget;
  usage: BudgetUsage;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ budget, usage, onEdit, onDelete }: BudgetCardProps) {
  const { byId, color, name } = useCategories();
  const money = useMoney();
  const category = byId.get(budget.categoryId);
  const label = name(budget.categoryId);

  return (
    <article
      className={cn(
        "rounded-2xl border bg-surface p-5 shadow-card",
        usage.status === "exceeded" ? "border-expense/40" : usage.status === "warning" ? "border-warning/40" : "border-line",
      )}
    >
      <div className="flex items-start gap-3">
        <CategoryIcon icon={category?.icon ?? "tag"} color={color(budget.categoryId)} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-fg">{label}</h3>
          <BudgetStatusBadge status={usage.status} />
        </div>
        <div className="-mr-1.5 -mt-1 flex">
          <IconButton icon={Pencil} label={`Edit ${label} budget`} onClick={onEdit} />
          <IconButton icon={Trash2} label={`Delete ${label} budget`} tone="danger" onClick={onDelete} />
        </div>
      </div>

      <p className="tabular mt-4 text-sm text-muted">
        <span className="text-lg font-semibold text-fg">{money.format(usage.spent)}</span> / {money.format(usage.limit)}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <ProgressBar value={usage.percent} tone={STATUS_TONE[usage.status]} label={`${label} budget used`} />
        <span className="tabular w-12 shrink-0 text-right text-sm font-medium text-fg">{usage.percent.toFixed(1)}%</span>
      </div>
      <p className={cn("tabular mt-3 flex items-center gap-1.5 text-sm", usage.status === "exceeded" ? "text-expense" : "text-muted")}>
        {usage.status !== "ok" && <TriangleAlert className="size-3.5" aria-hidden="true" />}
        {usage.remaining >= 0 ? `${money.format(usage.remaining)} remaining` : `${money.format(-usage.remaining)} over budget`}
      </p>
    </article>
  );
}
