import { ChevronLeft, ChevronRight, Copy, Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetFormModal } from "@/components/budgets/BudgetFormModal";
import { Button, IconButton } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { ProgressBar } from "@/components/common/ProgressBar";
import { useCategories } from "@/hooks/useCategories";
import { useMoney } from "@/hooks/useMoney";
import { useBudgetStore } from "@/store/budgetStore";
import { useTransactionStore } from "@/store/transactionStore";
import { useUIStore } from "@/store/uiStore";
import type { Budget } from "@/types";
import { currentMonthKey, formatMonth, shiftMonth } from "@/utils/dates";
import { budgetUsage, BUDGET_WARNING_PERCENT } from "@/utils/finance";

export default function BudgetsPage() {
  const budgets = useBudgetStore((s) => s.budgets);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);
  const copyMonth = useBudgetStore((s) => s.copyMonth);
  const transactions = useTransactionStore((s) => s.transactions);
  const toast = useUIStore((s) => s.toast);
  const { name } = useCategories();
  const money = useMoney();

  const [month, setMonth] = useState(currentMonthKey());
  const [form, setForm] = useState<{ open: boolean; editing: Budget | null }>({ open: false, editing: null });
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);

  const rows = useMemo(
    () =>
      budgets
        .filter((b) => b.month === month)
        .map((b) => ({ budget: b, usage: budgetUsage(b, transactions) }))
        .sort((a, b) => b.usage.percent - a.usage.percent),
    [budgets, transactions, month],
  );
  const previousMonth = shiftMonth(month, -1);
  const previousCount = budgets.filter((b) => b.month === previousMonth).length;

  const totals = rows.reduce((acc, r) => ({ limit: acc.limit + r.usage.limit, spent: acc.spent + r.usage.spent }), { limit: 0, spent: 0 });
  const totalPercent = totals.limit > 0 ? (totals.spent / totals.limit) * 100 : 0;
  const attention = rows.filter((r) => r.usage.status !== "ok").length;

  const copyPrevious = () => {
    const count = copyMonth(previousMonth, month);
    toast(count > 0 ? `${count} budget${count === 1 ? "" : "s"} copied from ${formatMonth(previousMonth)}` : "Nothing new to copy", count > 0 ? "success" : "info");
  };

  return (
    <>
      <PageHeader
        title="Budgets"
        description={`Monthly limits per expense category. Turns amber at ${BUDGET_WARNING_PERCENT}% and red past 100%.`}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, editing: null })}>
            Add budget
          </Button>
        }
      />

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-card">
          <IconButton icon={ChevronLeft} label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))} />
          <span className="min-w-36 text-center text-sm font-semibold text-fg" aria-live="polite">
            {formatMonth(month)}
          </span>
          <IconButton icon={ChevronRight} label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))} />
        </div>
        {month !== currentMonthKey() && (
          <Button variant="ghost" size="sm" onClick={() => setMonth(currentMonthKey())}>
            This month
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title={`No budgets for ${formatMonth(month)}`}
            description="Set a monthly limit for a category and spending is tracked automatically from your transactions."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, editing: null })}>
                  Add budget
                </Button>
                {previousCount > 0 && (
                  <Button icon={Copy} onClick={copyPrevious}>
                    Copy {previousCount} from {formatMonth(previousMonth)}
                  </Button>
                )}
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="mb-6 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted">Total budgeted</p>
                <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-fg">
                  {money.format(totals.spent)} <span className="text-base font-normal text-muted">/ {money.format(totals.limit)}</span>
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="tabular font-medium text-fg">
                  {totals.limit - totals.spent >= 0
                    ? `${money.format(totals.limit - totals.spent)} left`
                    : `${money.format(totals.spent - totals.limit)} over`}
                </p>
                <p className="text-muted">
                  {attention > 0 ? `${attention} budget${attention === 1 ? " needs" : "s need"} attention` : "Everything on track"}
                </p>
              </div>
            </div>
            <ProgressBar
              value={totalPercent}
              tone={totalPercent > 100 ? "expense" : totalPercent >= BUDGET_WARNING_PERCENT ? "warning" : "primary"}
              label="Total budget used"
              className="mt-4"
            />
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ budget, usage }) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                usage={usage}
                onEdit={() => setForm({ open: true, editing: budget })}
                onDelete={() => setPendingDelete(budget)}
              />
            ))}
          </div>
        </>
      )}

      <BudgetFormModal open={form.open} month={month} editing={form.editing} onClose={() => setForm((f) => ({ ...f, open: false }))} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete budget?"
        message={
          pendingDelete && (
            <>
              The <span className="font-medium text-fg">{name(pendingDelete.categoryId)}</span> budget for {formatMonth(pendingDelete.month)} will be
              removed. Your transactions are not affected.
            </>
          )
        }
        onConfirm={() => {
          if (pendingDelete) deleteBudget(pendingDelete.id);
          toast("Budget deleted");
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
