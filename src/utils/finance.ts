import type { Budget, FinancialGoal, Transaction, TransactionType } from "@/types";
import { monthKeyOf, monthsBetween, parseISODate } from "./dates";

export function sumBy(transactions: Transaction[], type: TransactionType): number {
  return transactions.reduce((total, t) => (t.type === type ? total + t.amount : total), 0);
}

export function inMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((t) => monthKeyOf(t.date) === month);
}

export function inMonths(transactions: Transaction[], months: string[]): Transaction[] {
  const set = new Set(months);
  return transactions.filter((t) => set.has(monthKeyOf(t.date)));
}

export function balance(transactions: Transaction[]): number {
  return sumBy(transactions, "income") - sumBy(transactions, "expense");
}

export interface MonthSummary {
  month: string;
  income: number;
  expense: number;
  savings: number;
  /** Savings as a share of income, 0–100; null when there is no income. */
  savingsRate: number | null;
}

export function summarizeMonth(transactions: Transaction[], month: string): MonthSummary {
  const monthly = inMonth(transactions, month);
  const income = sumBy(monthly, "income");
  const expense = sumBy(monthly, "expense");
  return { month, income, expense, savings: income - expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : null };
}

export function monthlySeries(transactions: Transaction[], months: string[]): MonthSummary[] {
  return months.map((month) => summarizeMonth(transactions, month));
}

export interface CategoryTotal {
  categoryId: string;
  amount: number;
  /** Share of the total, 0–100. */
  share: number;
}

export function totalsByCategory(transactions: Transaction[], type: TransactionType = "expense"): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type === type) totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount, share: grand > 0 ? (amount / grand) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export type BudgetStatus = "ok" | "warning" | "exceeded";

export interface BudgetUsage {
  spent: number;
  limit: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
}

export const BUDGET_WARNING_PERCENT = 80;

export function budgetUsage(budget: Budget, transactions: Transaction[]): BudgetUsage {
  const spent = transactions.reduce(
    (total, t) => (t.type === "expense" && t.categoryId === budget.categoryId && monthKeyOf(t.date) === budget.month ? total + t.amount : total),
    0,
  );
  const percent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
  const status: BudgetStatus = percent > 100 ? "exceeded" : percent >= BUDGET_WARNING_PERCENT ? "warning" : "ok";
  return { spent, limit: budget.limit, remaining: budget.limit - spent, percent, status };
}

export type GoalStatus = "completed" | "on-track" | "due-soon" | "overdue";

export interface GoalProgress {
  percent: number;
  remaining: number;
  monthsLeft: number;
  /** Saving needed per month to hit the target on time (0 if completed). */
  monthlyNeeded: number;
  status: GoalStatus;
}

export function goalProgress(goal: FinancialGoal, now = new Date()): GoalProgress {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const percent = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const target = parseISODate(goal.targetDate);
  const overdue = target.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  // Count the current month as available saving time.
  const monthsLeft = overdue ? 0 : monthsBetween(now, target) + 1;
  const status: GoalStatus =
    remaining === 0 ? "completed" : overdue ? "overdue" : monthsLeft <= 1 ? "due-soon" : "on-track";
  return { percent, remaining, monthsLeft, monthlyNeeded: remaining > 0 && monthsLeft > 0 ? remaining / monthsLeft : remaining, status };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
