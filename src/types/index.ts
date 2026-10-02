export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  /** Key into the curated icon set (see utils/icons.ts). */
  icon: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  notes?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  /** Month key, YYYY-MM. */
  month: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  /** ISO date, YYYY-MM-DD. */
  targetDate: string;
}

export type ThemePreference = "light" | "dark" | "system";

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "AED"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export interface Settings {
  name: string;
  currency: CurrencyCode;
  monthlyIncomeTarget: number;
  theme: ThemePreference;
}

export interface AppData {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  settings: Settings;
}
