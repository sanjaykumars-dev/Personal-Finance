import { z } from "zod";
import type { Budget, Category, FinancialGoal, Settings, Transaction } from "@/types";
import { budgetSchema, categorySchema, goalSchema, settingsSchema, transactionSchema } from "@/utils/schemas";

/**
 * Converts between app models (camelCase) and database rows (snake_case).
 * Rows read from the database are validated with the same Zod schemas used
 * for localStorage and backups, so bad rows never reach the stores.
 */

// Postgres numeric may arrive as a string; normalise to number before validating.
const num = z.union([z.number(), z.string()]).transform((v) => Number(v));

const categoryRow = z.object({ id: z.string(), name: z.string(), type: z.string(), icon: z.string() });
const transactionRow = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  amount: num,
  category_id: z.string(),
  date: z.string(),
  notes: z.string().nullable().optional(),
});
const budgetRow = z.object({ id: z.string(), category_id: z.string(), amount_limit: num, month: z.string() });
const goalRow = z.object({ id: z.string(), name: z.string(), target_amount: num, current_amount: num, target_date: z.string() });
const settingsRow = z.object({ name: z.string(), currency: z.string(), monthly_income_target: num, theme: z.string() });

type RowResult<T> = { items: T[]; invalid: number };

function parseRows<Row, T>(rows: unknown, rowSchema: z.ZodType<Row, z.ZodTypeDef, unknown>, toModel: (row: Row) => unknown, modelSchema: z.ZodType<T, z.ZodTypeDef, unknown>): RowResult<T> {
  const list = Array.isArray(rows) ? rows : [];
  const items: T[] = [];
  let invalid = 0;
  for (const raw of list) {
    const row = rowSchema.safeParse(raw);
    const model = row.success ? modelSchema.safeParse(toModel(row.data)) : null;
    if (model?.success) items.push(model.data);
    else invalid++;
  }
  return { items, invalid };
}

export const fromRows = {
  categories: (rows: unknown) =>
    parseRows(rows, categoryRow, (r) => ({ id: r.id, name: r.name, type: r.type, icon: r.icon }), categorySchema),
  transactions: (rows: unknown) =>
    parseRows(
      rows,
      transactionRow,
      (r) => ({
        id: r.id,
        type: r.type,
        description: r.description,
        amount: r.amount,
        categoryId: r.category_id,
        date: r.date,
        ...(r.notes ? { notes: r.notes } : {}),
      }),
      transactionSchema,
    ),
  budgets: (rows: unknown) =>
    parseRows(rows, budgetRow, (r) => ({ id: r.id, categoryId: r.category_id, limit: r.amount_limit, month: r.month }), budgetSchema),
  goals: (rows: unknown) =>
    parseRows(
      rows,
      goalRow,
      (r) => ({ id: r.id, name: r.name, targetAmount: r.target_amount, currentAmount: r.current_amount, targetDate: r.target_date }),
      goalSchema,
    ),
};

export function settingsFromRow(row: unknown): Settings | null {
  const parsed = settingsRow.safeParse(row);
  if (!parsed.success) return null;
  const r = parsed.data;
  const settings = settingsSchema.safeParse({ name: r.name, currency: r.currency, monthlyIncomeTarget: r.monthly_income_target, theme: r.theme });
  return settings.success ? settings.data : null;
}

export const toRow = {
  categories: (c: Category, userId: string) => ({ user_id: userId, id: c.id, name: c.name, type: c.type, icon: c.icon }),
  transactions: (t: Transaction, userId: string) => ({
    user_id: userId,
    id: t.id,
    type: t.type,
    description: t.description,
    amount: t.amount,
    category_id: t.categoryId,
    date: t.date,
    notes: t.notes ?? null,
  }),
  budgets: (b: Budget, userId: string) => ({ user_id: userId, id: b.id, category_id: b.categoryId, amount_limit: b.limit, month: b.month }),
  goals: (g: FinancialGoal, userId: string) => ({
    user_id: userId,
    id: g.id,
    name: g.name,
    target_amount: g.targetAmount,
    current_amount: g.currentAmount,
    target_date: g.targetDate,
  }),
};

export function settingsToRow(s: Settings, userId: string) {
  return {
    user_id: userId,
    name: s.name,
    currency: s.currency,
    monthly_income_target: s.monthlyIncomeTarget,
    theme: s.theme,
    updated_at: new Date().toISOString(),
  };
}
