import { CalendarClock, CircleCheck, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/common/Button";
import { ProgressBar } from "@/components/common/ProgressBar";
import { useMoney } from "@/hooks/useMoney";
import type { FinancialGoal } from "@/types";
import { cn } from "@/utils/cn";
import { formatMonth, monthKeyOf } from "@/utils/dates";
import { goalProgress, type GoalStatus } from "@/utils/finance";

const STATUS: Record<GoalStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-income-soft text-income" },
  "on-track": { label: "In progress", className: "bg-primary-soft text-primary" },
  "due-soon": { label: "Due this month", className: "bg-warning-soft text-warning" },
  overdue: { label: "Past target date", className: "bg-expense-soft text-expense" },
};

interface GoalCardProps {
  goal: FinancialGoal;
  onContribute: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalCard({ goal, onContribute, onEdit, onDelete }: GoalCardProps) {
  const money = useMoney();
  const progress = goalProgress(goal);
  const status = STATUS[progress.status];
  const done = progress.status === "completed";

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", done ? "bg-income-soft text-income" : "bg-primary-soft text-primary")}>
          {done ? <CircleCheck className="size-5" aria-hidden="true" /> : <PiggyBank className="size-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-fg">{goal.name}</h3>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>{status.label}</span>
        </div>
        <div className="-mr-1.5 -mt-1 flex">
          <IconButton icon={Pencil} label={`Edit ${goal.name}`} onClick={onEdit} />
          <IconButton icon={Trash2} label={`Delete ${goal.name}`} tone="danger" onClick={onDelete} />
        </div>
      </div>

      <p className="tabular mt-5 text-sm text-muted">
        <span className="text-lg font-semibold text-fg">{money.format(goal.currentAmount)}</span> / {money.format(goal.targetAmount)}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <ProgressBar value={progress.percent} tone={done ? "income" : "primary"} label={`${goal.name} progress`} />
        <span className="tabular w-11 shrink-0 text-right text-sm font-medium text-fg">{progress.percent.toFixed(0)}%</span>
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-muted">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            Target
          </dt>
          <dd className="font-medium text-fg">{formatMonth(monthKeyOf(goal.targetDate))}</dd>
        </div>
        {!done && (
          <>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Remaining</dt>
              <dd className="tabular font-medium text-fg">{money.format(progress.remaining)}</dd>
            </div>
            {progress.status !== "overdue" && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Needed per month</dt>
                <dd className="tabular font-medium text-fg">{money.format(progress.monthlyNeeded)}</dd>
              </div>
            )}
          </>
        )}
      </dl>

      <Button icon={Plus} className="mt-5 w-full" onClick={onContribute} disabled={done}>
        {done ? "Goal reached" : "Add contribution"}
      </Button>
    </article>
  );
}
