import { ChartPie, CircleAlert, Lightbulb, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryDonut } from "@/components/analytics/CategoryDonut";
import { IncomeExpenseChart } from "@/components/analytics/IncomeExpenseChart";
import { MonthlySpendingChart } from "@/components/analytics/MonthlySpendingChart";
import { Card, CardHeader } from "@/components/common/Card";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { EmptyState } from "@/components/common/EmptyState";
import { SegmentedControl } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { useCategories } from "@/hooks/useCategories";
import { useMoney } from "@/hooks/useMoney";
import { useBudgetStore } from "@/store/budgetStore";
import { useGoalStore } from "@/store/goalStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTransactionStore } from "@/store/transactionStore";
import { cn } from "@/utils/cn";
import { formatMonth, lastMonths } from "@/utils/dates";
import { inMonths, monthlySeries, totalsByCategory } from "@/utils/finance";
import { generateInsights, type InsightTone } from "@/utils/insights";

type Period = "3" | "6" | "12";

const TONE_STYLE: Record<InsightTone, { icon: typeof TrendingUp; className: string }> = {
  positive: { icon: TrendingUp, className: "bg-income-soft text-income" },
  negative: { icon: CircleAlert, className: "bg-expense-soft text-expense" },
  neutral: { icon: Lightbulb, className: "bg-primary-soft text-primary" },
};

export default function AnalyticsPage() {
  const transactions = useTransactionStore((s) => s.transactions);
  const budgets = useBudgetStore((s) => s.budgets);
  const goals = useGoalStore((s) => s.goals);
  const currency = useSettingsStore((s) => s.currency);
  const monthlyIncomeTarget = useSettingsStore((s) => s.monthlyIncomeTarget);
  const { categories, byId, color, name } = useCategories();
  const money = useMoney();
  const [period, setPeriod] = useState<Period>("6");

  const data = useMemo(() => {
    const months = lastMonths(Number(period));
    const series = monthlySeries(transactions, months);
    const inPeriod = inMonths(transactions, months);
    const byCategory = totalsByCategory(inPeriod);
    const totalExpense = series.reduce((s, m) => s + m.expense, 0);
    const totalIncome = series.reduce((s, m) => s + m.income, 0);
    const largest = inPeriod.filter((t) => t.type === "expense").sort((a, b) => b.amount - a.amount)[0];
    return {
      months,
      series,
      byCategory,
      avgSpending: totalExpense / months.length,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : null,
      largest,
    };
  }, [transactions, period]);

  const insights = useMemo(
    () => generateInsights({ transactions, categories, budgets, goals, currency, monthlyIncomeTarget }),
    [transactions, categories, budgets, goals, currency, monthlyIncomeTarget],
  );

  const range = `${formatMonth(data.months[0] ?? "")} – ${formatMonth(data.months.at(-1) ?? "")}`;
  const top = data.byCategory.slice(0, 5);
  const topMax = top[0]?.amount ?? 0;

  if (transactions.length === 0) {
    return (
      <>
        <PageHeader title="Analytics" description="Trends and insights from your transactions." />
        <Card>
          <EmptyState icon={ChartPie} title="Nothing to analyse yet" description="Once you add transactions, charts and insights will appear here." />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description={range}
        actions={
          <div className="w-64">
            <SegmentedControl
              name="analytics-period"
              label="Time period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: "3", label: "3 months" },
                { value: "6", label: "6 months" },
                { value: "12", label: "12 months" },
              ]}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Average monthly spending" value={money.format(data.avgSpending)} icon={TrendingDown} tone="expense" footnote={`Over ${period} months`} />
        <StatCard
          label="Savings rate"
          value={data.savingsRate !== null ? `${data.savingsRate.toFixed(0)}%` : "—"}
          icon={TrendingUp}
          tone="income"
          footnote="Share of income kept"
        />
        <StatCard
          label="Largest expense"
          value={data.largest ? money.format(data.largest.amount) : "—"}
          icon={Minus}
          tone="warning"
          footnote={data.largest ? `${data.largest.description} · ${name(data.largest.categoryId)}` : "No expenses in this period"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Monthly Spending" description="Total expenses per month" />
          <div className="px-3 py-4 sm:px-5">
            <MonthlySpendingChart data={data.series} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Income vs Expenses" description="Monthly comparison" />
          <div className="px-3 py-4 sm:px-5">
            <IncomeExpenseChart data={data.series} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader title="Category Breakdown" description="Expenses by category" />
          <div className="p-5">
            {data.byCategory.length > 0 ? (
              <CategoryDonut data={data.byCategory} maxSlices={7} centerLabel="Spent" />
            ) : (
              <EmptyState icon={ChartPie} title="No expenses" description="No spending recorded in this period." compact />
            )}
          </div>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader title="Top Spending Categories" description={`Last ${period} months`} />
          <div className="p-5">
            {top.length > 0 ? (
              <ol className="space-y-4">
                {top.map((item, index) => (
                  <li key={item.categoryId} className="flex items-center gap-3">
                    <span className="tabular w-4 text-sm font-medium text-subtle">{index + 1}</span>
                    <CategoryIcon icon={byId.get(item.categoryId)?.icon ?? "tag"} color={color(item.categoryId)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-fg">{name(item.categoryId)}</span>
                        <span className="tabular font-semibold text-fg">{money.format(item.amount)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${topMax > 0 ? (item.amount / topMax) * 100 : 0}%`, backgroundColor: color(item.categoryId) }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState icon={ChartPie} title="No expenses" description="No spending recorded in this period." compact />
            )}
          </div>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader title="Financial Insights" description="Based on your data this month" />
          <div className="p-5">
            {insights.length > 0 ? (
              <ul className="space-y-4">
                {insights.map((insight) => {
                  const tone = TONE_STYLE[insight.tone];
                  const Icon = tone.icon;
                  return (
                    <li key={insight.id} className="flex gap-3">
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", tone.className)}>
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg">{insight.title}</p>
                        <p className="mt-0.5 text-xs text-muted">{insight.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={Lightbulb} title="No insights yet" description="Add this month's income and expenses to see insights." compact />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
