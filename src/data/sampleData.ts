import type { AppData, Budget, Category, FinancialGoal, Settings, Transaction } from "@/types";
import { monthKey, toISODate } from "@/utils/dates";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-food", name: "Food", type: "expense", icon: "utensils" },
  { id: "cat-transport", name: "Transport", type: "expense", icon: "car" },
  { id: "cat-shopping", name: "Shopping", type: "expense", icon: "shopping-bag" },
  { id: "cat-rent", name: "Rent", type: "expense", icon: "house" },
  { id: "cat-utilities", name: "Utilities", type: "expense", icon: "zap" },
  { id: "cat-entertainment", name: "Entertainment", type: "expense", icon: "clapperboard" },
  { id: "cat-health", name: "Health", type: "expense", icon: "heart-pulse" },
  { id: "cat-travel", name: "Travel", type: "expense", icon: "plane" },
  { id: "cat-education", name: "Education", type: "expense", icon: "graduation-cap" },
  { id: "cat-other", name: "Other", type: "expense", icon: "package" },
  { id: "cat-salary", name: "Salary", type: "income", icon: "briefcase" },
  { id: "cat-freelance", name: "Freelance", type: "income", icon: "laptop" },
  { id: "cat-investment", name: "Investment", type: "income", icon: "trending-up" },
  { id: "cat-bonus", name: "Bonus", type: "income", icon: "gift" },
  { id: "cat-other-income", name: "Other Income", type: "income", icon: "coins" },
];

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  currency: "INR",
  monthlyIncomeTarget: 0,
  theme: "system",
};

type Template = Omit<Transaction, "id" | "date"> & { day: number };

const recurring: Template[] = [
  { type: "income", description: "Salary", amount: 67693, categoryId: "cat-salary", day: 1, notes: "Monthly salary credit" },
  { type: "expense", description: "House Rent", amount: 8000, categoryId: "cat-rent", day: 3 },
];

/** Index 0 = five months ago … index 5 = the current month. */
const monthly: Template[][] = [
  [
    { type: "expense", description: "Groceries", amount: 3120, categoryId: "cat-food", day: 8 },
    { type: "expense", description: "Movie tickets", amount: 760, categoryId: "cat-entertainment", day: 20 },
  ],
  [
    { type: "income", description: "Freelance project", amount: 12000, categoryId: "cat-freelance", day: 10, notes: "Landing page redesign" },
    { type: "expense", description: "Fuel", amount: 2000, categoryId: "cat-transport", day: 14 },
    { type: "expense", description: "Restaurant dinner", amount: 1250, categoryId: "cat-food", day: 22 },
  ],
  [
    { type: "expense", description: "Groceries", amount: 3450, categoryId: "cat-food", day: 6, notes: "Weekly groceries" },
    { type: "expense", description: "Doctor consultation", amount: 1200, categoryId: "cat-health", day: 15 },
    { type: "expense", description: "Online course", amount: 2999, categoryId: "cat-education", day: 25 },
  ],
  [
    { type: "income", description: "Festive bonus", amount: 15000, categoryId: "cat-bonus", day: 5 },
    { type: "expense", description: "Electricity bill", amount: 1480, categoryId: "cat-utilities", day: 11 },
    { type: "expense", description: "Flight tickets", amount: 6800, categoryId: "cat-travel", day: 18, notes: "Weekend trip" },
  ],
  [
    { type: "income", description: "Freelance project", amount: 9500, categoryId: "cat-freelance", day: 9 },
    { type: "expense", description: "Online shopping", amount: 5400, categoryId: "cat-shopping", day: 16 },
    { type: "expense", description: "Fuel", amount: 2200, categoryId: "cat-transport", day: 21 },
    { type: "income", description: "Mutual fund dividend", amount: 1850, categoryId: "cat-investment", day: 26 },
  ],
  [
    { type: "expense", description: "Grocery Shopping", amount: 3450, categoryId: "cat-food", day: 2, notes: "Weekly groceries" },
    { type: "expense", description: "Fuel", amount: 2000, categoryId: "cat-transport", day: 4 },
    { type: "expense", description: "Restaurant", amount: 1250, categoryId: "cat-food", day: 6 },
    { type: "expense", description: "Clothing", amount: 4300, categoryId: "cat-shopping", day: 8 },
    { type: "expense", description: "Concert tickets", amount: 1650, categoryId: "cat-entertainment", day: 9 },
  ],
];

function endOfMonth(now: Date, offset: number): string {
  return toISODate(new Date(now.getFullYear(), now.getMonth() + offset + 1, 0));
}

/**
 * Realistic data spanning the last six months, generated relative to `now`
 * so the app always looks current. IDs are deterministic.
 */
export function createSampleData(now = new Date()): AppData {
  const transactions: Transaction[] = [];
  let counter = 0;

  monthly.forEach((extras, index) => {
    const offset = index - (monthly.length - 1);
    const isCurrent = offset === 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0).getDate();
    // Never create future-dated entries in the current month.
    const lastDay = isCurrent ? now.getDate() : daysInMonth;
    for (const { day, ...template } of [...recurring, ...extras]) {
      const date = new Date(now.getFullYear(), now.getMonth() + offset, Math.min(day, lastDay));
      transactions.push({ ...template, id: `txn-sample-${String(++counter).padStart(2, "0")}`, date: toISODate(date) });
    }
  });

  const month = monthKey(now);
  const budgets: Budget[] = [
    { id: "bud-sample-food", categoryId: "cat-food", limit: 10000, month },
    { id: "bud-sample-transport", categoryId: "cat-transport", limit: 2500, month },
    { id: "bud-sample-shopping", categoryId: "cat-shopping", limit: 5000, month },
    { id: "bud-sample-entertainment", categoryId: "cat-entertainment", limit: 1500, month },
  ];

  const goals: FinancialGoal[] = [
    { id: "goal-sample-emergency", name: "Emergency Fund", targetAmount: 100000, currentAmount: 75000, targetDate: endOfMonth(now, 2) },
    { id: "goal-sample-trip", name: "Goa Trip", targetAmount: 40000, currentAmount: 18500, targetDate: endOfMonth(now, 4) },
    { id: "goal-sample-laptop", name: "New Laptop", targetAmount: 90000, currentAmount: 42000, targetDate: endOfMonth(now, 6) },
  ];

  return {
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    // Newest first, matching how the store orders new entries.
    transactions: transactions.reverse(),
    budgets,
    goals,
    settings: { ...DEFAULT_SETTINGS, name: "Aarav", monthlyIncomeTarget: 75000 },
  };
}

/** State after "Reset application": default categories, everything else empty. */
export function createEmptyData(): AppData {
  return {
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    transactions: [],
    budgets: [],
    goals: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
