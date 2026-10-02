import { ProgressBar } from "@/components/common/ProgressBar";
import { useMoney } from "@/hooks/useMoney";
import type { FinancialGoal } from "@/types";
import { formatMonth, monthKeyOf } from "@/utils/dates";
import { goalProgress } from "@/utils/finance";

export function GoalProgressRow({ goal }: { goal: FinancialGoal }) {
  const money = useMoney();
  const progress = goalProgress(goal);
  return (
    <li>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-medium text-fg">{goal.name}</span>
        <span className="tabular text-xs font-medium text-muted">{progress.percent.toFixed(0)}%</span>
      </div>
      <ProgressBar value={progress.percent} tone={progress.status === "completed" ? "income" : "primary"} size="sm" className="mt-1.5" label={`${goal.name} progress`} />
      <p className="tabular mt-1.5 text-xs text-subtle">
        {money.format(goal.currentAmount)} of {money.format(goal.targetAmount)} · by {formatMonth(monthKeyOf(goal.targetDate))}
      </p>
    </li>
  );
}
