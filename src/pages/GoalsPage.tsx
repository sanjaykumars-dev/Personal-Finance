import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ContributionModal } from "@/components/goals/ContributionModal";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { useMoney } from "@/hooks/useMoney";
import { useGoalStore } from "@/store/goalStore";
import { useUIStore } from "@/store/uiStore";
import type { FinancialGoal } from "@/types";

export default function GoalsPage() {
  const goals = useGoalStore((s) => s.goals);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const toast = useUIStore((s) => s.toast);
  const money = useMoney();

  const [form, setForm] = useState<{ open: boolean; editing: FinancialGoal | null }>({ open: false, editing: null });
  const [contributing, setContributing] = useState<FinancialGoal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FinancialGoal | null>(null);

  const sorted = [...goals].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const saved = goals.reduce((s, g) => s + Math.min(g.currentAmount, g.targetAmount), 0);
  const target = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completed = goals.filter((g) => g.currentAmount >= g.targetAmount).length;

  return (
    <>
      <PageHeader
        title="Goals"
        description="Save towards what matters, one contribution at a time."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, editing: null })}>
            New goal
          </Button>
        }
      />

      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="No savings goals yet"
            description="Create a goal like an emergency fund or a trip, then add contributions as you save."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, editing: null })}>
                Create your first goal
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="mb-6 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted">Saved across all goals</p>
                <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-fg">
                  {money.format(saved)} <span className="text-base font-normal text-muted">/ {money.format(target)}</span>
                </p>
              </div>
              <p className="text-sm text-muted">
                {completed} of {goals.length} goal{goals.length === 1 ? "" : "s"} completed
              </p>
            </div>
            <ProgressBar value={target > 0 ? (saved / target) * 100 : 0} label="Overall goal progress" className="mt-4" />
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onContribute={() => setContributing(goal)}
                onEdit={() => setForm({ open: true, editing: goal })}
                onDelete={() => setPendingDelete(goal)}
              />
            ))}
          </div>
        </>
      )}

      <GoalFormModal open={form.open} editing={form.editing} onClose={() => setForm((f) => ({ ...f, open: false }))} />
      <ContributionModal goal={contributing} onClose={() => setContributing(null)} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete goal?"
        message={
          pendingDelete && (
            <>
              <span className="font-medium text-fg">{pendingDelete.name}</span> and its saved progress of {money.format(pendingDelete.currentAmount)}{" "}
              will be removed.
            </>
          )
        }
        onConfirm={() => {
          if (pendingDelete) deleteGoal(pendingDelete.id);
          toast("Goal deleted");
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
