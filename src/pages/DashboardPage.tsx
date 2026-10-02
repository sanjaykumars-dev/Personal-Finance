import { ArrowRight, ChartPie, Plus, Receipt, Target, Wallet } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { CategoryDonut } from "@/components/analytics/CategoryDonut";
import { IncomeExpenseChart } from "@/components/analytics/IncomeExpenseChart";
import { BudgetProgressRow } from "@/components/budgets/BudgetProgress";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { GoalProgressRow } from "@/components/goals/GoalProgressRow";
import { TransactionListItem } from "@/components/transactions/TransactionListItem";
import { useBudgetStore } from "@/store/budgetStore";
import { useGoalStore } from "@/store/goalStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTransactionStore } from "@/store/transactionStore";
import { useUIStore } from "@/store/uiStore";
import { currentMonthKey, formatMonth, lastMonths } from "@/utils/dates";
import { compareDates } from "@/utils/filters";
import { balance, budgetUsage, inMonth, monthlySeries, summarizeMonth, totalsByCategory } from "@/utils/finance";

function ViewAll({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
      {label}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const transactions = useTransactionStore((s) => s.transactions);
  const budgets = useBudgetStore((s) => s.budgets);
  const goals = useGoalStore((s) => s.goals);
  const name = useSettingsStore((s) => s.name);
  const openAdd = useUIStore((s) => s.openAddTransaction);
  const month = currentMonthKey();

  const stats = useMemo(() => {
    const summary = summarizeMonth(transactions, month);
    return {
      total: balance(transactions),
      summary,
      series: monthlySeries(transactions, lastMonths(6, month)),
      byCategory: totalsByCategory(inMonth(transactions, month)),
      recent: [...transactions].sort((a, b) => compareDates(b.date, a.date)).slice(0, 6),
      budgetRows: budgets
        .filter((b) => b.month === month)
        .map((b) => ({ budget: b, usage: budgetUsage(b, transactions) }))
        .sort((a, b) => b.usage.percent - a.usage.percent),
    };
  }, [transactions, budgets, month]);

  const { summary } = stats;
  const hasData = transactions.length > 0;

  return (
    <>
      <PageHeader
        title={name.trim() ? `${greeting()}, ${name.trim()}` : greeting()}
        description={`Here's your financial overview for ${formatMonth(month)}.`}
        actions={
          <span className="hidden sm:block">
            <Button variant="primary" icon={Plus} onClick={() => openAdd()}>
              Add Transaction
            </Button>
          </span>
        }
      />

      <SummaryCards totalBalance={stats.total} month={summary} />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Income vs Expenses" description="Last 6 months" action={<ViewAll to="/analytics" label="Analytics" />} />
          <div className="px-3 pt-4 pb-4 sm:px-5">
            {hasData ? (
              <IncomeExpenseChart data={stats.series} />
            ) : (
              <EmptyState icon={ChartPie} title="No data yet" description="Add a few transactions to see your monthly trend." compact />
            )}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Spending by Category" description={formatMonth(month)} />
          <div className="p-5">
            {stats.byCategory.length > 0 ? (
              <CategoryDonut data={stats.byCategory} centerLabel="Spent" />
            ) : (
              <EmptyState icon={ChartPie} title="No expenses this month" description="Your category breakdown will appear here." compact />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Recent Transactions" action={hasData ? <ViewAll to="/transactions" label="View all" /> : undefined} />
          <div className="px-5 pb-2">
            {stats.recent.length > 0 ? (
              <ul className="divide-y divide-line">
                {stats.recent.map((t) => (
                  <li key={t.id}>
                    <TransactionListItem transaction={t} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Record your first income or expense to get started."
                action={
                  <Button variant="primary" icon={Plus} onClick={() => openAdd()}>
                    Add Transaction
                  </Button>
                }
              />
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader title="Budget Overview" description={formatMonth(month)} action={<ViewAll to="/budgets" label="Manage" />} />
            <div className="p-5">
              {stats.budgetRows.length > 0 ? (
                <ul className="space-y-4">
                  {stats.budgetRows.slice(0, 5).map(({ budget, usage }) => (
                    <BudgetProgressRow key={budget.id} budget={budget} usage={usage} />
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Wallet} title="No budgets this month" description="Set monthly limits to keep spending in check." compact />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Savings Goals" action={<ViewAll to="/goals" label="View goals" />} />
            <div className="p-5">
              {goals.length > 0 ? (
                <ul className="space-y-4">
                  {goals.slice(0, 4).map((goal) => (
                    <GoalProgressRow key={goal.id} goal={goal} />
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Target} title="No goals yet" description="Create a savings goal and track your progress." compact />
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
