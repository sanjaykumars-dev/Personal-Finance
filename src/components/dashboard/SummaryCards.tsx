import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useMoney } from "@/hooks/useMoney";
import { formatMonth } from "@/utils/dates";
import type { MonthSummary } from "@/utils/finance";

interface SummaryCardsProps {
  totalBalance: number;
  month: MonthSummary;
}

/** The four headline numbers. All values are derived from transactions by the caller. */
export function SummaryCards({ totalBalance, month }: SummaryCardsProps) {
  const money = useMoney();
  const label = formatMonth(month.month);
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatCard label="Total Balance" value={money.format(totalBalance)} icon={Wallet} footnote="All income minus all expenses" />
      <StatCard label="Monthly Income" value={money.format(month.income)} icon={TrendingUp} tone="income" footnote={label} />
      <StatCard label="Monthly Expenses" value={money.format(month.expense)} icon={TrendingDown} tone="expense" footnote={label} />
      <StatCard
        label="Monthly Savings"
        value={money.format(month.savings)}
        icon={PiggyBank}
        tone={month.savings < 0 ? "expense" : "warning"}
        footnote={month.savingsRate !== null ? `${month.savingsRate.toFixed(0)}% of income saved` : "No income recorded yet"}
      />
    </div>
  );
}
