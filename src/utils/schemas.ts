import { z } from "zod";
import { CURRENCIES } from "@/types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const monthKey = z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM");
const id = z.string().min(1);
const money = z.number().finite().nonnegative();

export const categorySchema = z.object({
  id,
  name: z.string().trim().min(1).max(40),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1),
});

export const transactionSchema = z.object({
  id,
  type: z.enum(["income", "expense"]),
  description: z.string().trim().min(1).max(80),
  amount: money.positive(),
  categoryId: id,
  date: isoDate,
  notes: z.string().max(200).optional(),
});

export const budgetSchema = z.object({ id, categoryId: id, limit: money.positive(), month: monthKey });

export const goalSchema = z.object({
  id,
  name: z.string().trim().min(1).max(60),
  targetAmount: money.positive(),
  currentAmount: money,
  targetDate: isoDate,
});

export const settingsSchema = z.object({
  name: z.string().max(40),
  currency: z.enum(CURRENCIES),
  monthlyIncomeTarget: money,
  theme: z.enum(["light", "dark", "system"]),
});

/** Full backup file. Relationships are checked separately in utils/backup.ts. */
export const appDataSchema = z.object({
  categories: z.array(categorySchema),
  transactions: z.array(transactionSchema),
  budgets: z.array(budgetSchema),
  goals: z.array(goalSchema),
  settings: settingsSchema,
});
