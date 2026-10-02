import type { Budget, Category, CurrencyCode, FinancialGoal, Transaction } from "@/types";
import { formatMonth, monthKeyOf, shiftMonth } from "./dates";
import { budgetUsage, goalProgress, percentChange, summarizeMonth, totalsByCategory } from "./finance";
import { formatCurrency } from "./format";

export type InsightTone = "positive" | "negative" | "neutral";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
}

interface InsightInput {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: FinancialGoal[];
  currency: CurrencyCode;
  monthlyIncomeTarget: number;
  now?: Date;
}

/** Expenses from day 1 up to and including `day` of `month`. */
function expensesThrough(transactions: Transaction[], month: string, day: number): number {
  return transactions.reduce((total, t) => {
    if (t.type !== "expense" || monthKeyOf(t.date) !== month) return total;
    return Number(t.date.slice(8, 10)) <= day ? total + t.amount : total;
  }, 0);
}

/**
 * Plain-language observations computed from the user's actual data. Every
 * insight is conditional: if the data can't support a statement, it's omitted.
 */
export function generateInsights(input: InsightInput): Insight[] {
  const { transactions, categories, budgets, goals, currency, monthlyIncomeTarget, now = new Date() } = input;
  const money = (n: number) => formatCurrency(n, currency);
  const nameOf = (id: string) => categories.find((c) => c.id === id)?.name ?? "Uncategorized";
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const previous = shiftMonth(month, -1);
  const current = summarizeMonth(transactions, month);
  const last = summarizeMonth(transactions, previous);
  const insights: Insight[] = [];

  // 1. Month-to-date spending vs the same days last month (a fair comparison mid-month).
  const day = now.getDate();
  const mtd = expensesThrough(transactions, month, day);
  const lastMtd = expensesThrough(transactions, previous, day);
  const change = percentChange(mtd, lastMtd);
  if (change !== null && Math.abs(change) >= 1) {
    const lower = change < 0;
    insights.push({
      id: "mtd-change",
      tone: lower ? "positive" : "negative",
      title: `Your expenses ${lower ? "decreased" : "increased"} ${Math.abs(change).toFixed(0)}% compared with last month.`,
      detail: `${money(mtd)} spent in the first ${day} day${day === 1 ? "" : "s"} of ${formatMonth(month)}, versus ${money(lastMtd)} over the same days of ${formatMonth(previous)}.`,
    });
  }

  // 2. Savings rate.
  if (current.savingsRate !== null) {
    const rate = current.savingsRate;
    insights.push({
      id: "savings-rate",
      tone: rate >= 20 ? "positive" : rate >= 0 ? "neutral" : "negative",
      title: rate >= 0 ? `You saved ${rate.toFixed(0)}% of your income this month.` : `You've spent ${money(-current.savings)} more than you earned this month.`,
      detail:
        last.savingsRate !== null
          ? `Last month your savings rate was ${last.savingsRate.toFixed(0)}%.`
          : `${money(current.income)} earned, ${money(current.expense)} spent so far.`,
    });
  }

  // 3. Largest expense category this month, and the largest one excluding the biggest fixed cost.
  const byCategory = totalsByCategory(transactions.filter((t) => monthKeyOf(t.date) === month));
  const top = byCategory[0];
  if (top) {
    insights.push({
      id: "top-category",
      tone: "neutral",
      title: `${nameOf(top.categoryId)} is your highest expense this month.`,
      detail: `${money(top.amount)}, or ${top.share.toFixed(0)}% of this month's spending.`,
    });
    // A "variable" expense is one whose monthly amount actually varies.
    const isFixed = (categoryId: string) => {
      const amounts = [0, 1, 2].map((i) =>
        transactions
          .filter((t) => t.type === "expense" && t.categoryId === categoryId && monthKeyOf(t.date) === shiftMonth(month, -i))
          .reduce((s, t) => s + t.amount, 0),
      );
      return amounts.every((a) => a > 0 && a === amounts[0]);
    };
    const variable = byCategory.find((c) => !isFixed(c.categoryId));
    if (variable && variable.categoryId !== top.categoryId) {
      insights.push({
        id: "top-variable",
        tone: "neutral",
        title: `${nameOf(variable.categoryId)} is your highest variable expense this month.`,
        detail: `${money(variable.amount)} so far. ${nameOf(top.categoryId)} looks like a fixed monthly cost.`,
      });
    }
  }

  // 4. Budgets at risk.
  const usages = budgets.filter((b) => b.month === month).map((b) => ({ budget: b, usage: budgetUsage(b, transactions) }));
  const exceeded = usages.filter((u) => u.usage.status === "exceeded");
  const warning = usages.filter((u) => u.usage.status === "warning");
  if (exceeded.length > 0) {
    insights.push({
      id: "budgets-exceeded",
      tone: "negative",
      title: `${exceeded.length === 1 ? `Your ${nameOf(exceeded[0]?.budget.categoryId ?? "")} budget is` : `${exceeded.length} budgets are`} over the limit.`,
      detail: exceeded
        .map((u) => `${nameOf(u.budget.categoryId)}: ${money(-u.usage.remaining)} over`)
        .join(" · "),
    });
  }
  if (warning.length > 0) {
    insights.push({
      id: "budgets-warning",
      tone: "neutral",
      title: `${warning.length === 1 ? `${nameOf(warning[0]?.budget.categoryId ?? "")} has` : `${warning.length} budgets have`} used over 80% of the limit.`,
      detail: warning.map((u) => `${nameOf(u.budget.categoryId)}: ${money(u.usage.remaining)} left`).join(" · "),
    });
  } else if (usages.length > 0 && exceeded.length === 0) {
    insights.push({
      id: "budgets-ok",
      tone: "positive",
      title: "All your budgets are on track this month.",
      detail: `${usages.length} budget${usages.length === 1 ? "" : "s"} below 80% of their limits.`,
    });
  }

  // 5. Income target.
  if (monthlyIncomeTarget > 0 && current.income > 0) {
    const share = (current.income / monthlyIncomeTarget) * 100;
    insights.push({
      id: "income-target",
      tone: share >= 100 ? "positive" : "neutral",
      title: share >= 100 ? "You've reached your monthly income target." : `You've reached ${share.toFixed(0)}% of your monthly income target.`,
      detail: `${money(current.income)} of ${money(monthlyIncomeTarget)} this month.`,
    });
  }

  // 6. Goal closest to its deadline.
  const open = goals
    .map((g) => ({ goal: g, progress: goalProgress(g, now) }))
    .filter((g) => g.progress.status !== "completed")
    .sort((a, b) => a.goal.targetDate.localeCompare(b.goal.targetDate));
  const nextGoal = open[0];
  if (nextGoal) {
    const { goal, progress } = nextGoal;
    insights.push({
      id: "next-goal",
      tone: progress.status === "overdue" ? "negative" : "neutral",
      title:
        progress.status === "overdue"
          ? `${goal.name} is past its target date.`
          : `Save ${money(progress.monthlyNeeded)} a month to reach ${goal.name} on time.`,
      detail: `${money(progress.remaining)} to go · ${progress.percent.toFixed(0)}% complete.`,
    });
  }

  return insights;
}
