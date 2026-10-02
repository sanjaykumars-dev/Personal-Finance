import { supabase } from "@/lib/supabase";
import type { AppData } from "@/types";
import { fromRows, settingsFromRow } from "./mappers";

const PAGE = 1000; // Supabase's default max rows per request

type OrderBy = { column: string; ascending: boolean }[];

async function fetchAll(table: string, order: OrderBy): Promise<unknown[]> {
  if (!supabase) throw new Error("Cloud sync is not configured.");
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase.from(table).select("*");
    for (const o of order) query = query.order(o.column, { ascending: o.ascending });
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

export type RemoteLoad = { kind: "ready"; data: AppData; skipped: number } | { kind: "empty" };

/** Loads the signed-in user's data. RLS scopes every query to their rows. */
export async function fetchRemoteData(): Promise<RemoteLoad> {
  if (!supabase) throw new Error("Cloud sync is not configured.");
  const settingsResult = await supabase.from("settings").select("*").maybeSingle();
  if (settingsResult.error) throw settingsResult.error;
  // No settings row means the account hasn't been set up yet.
  if (!settingsResult.data) return { kind: "empty" };

  const [categories, transactions, budgets, goals] = await Promise.all([
    fetchAll("categories", [
      { column: "position", ascending: true },
      { column: "created_at", ascending: true },
    ]),
    fetchAll("transactions", [
      { column: "date", ascending: false },
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]),
    fetchAll("budgets", [{ column: "created_at", ascending: true }]),
    fetchAll("goals", [{ column: "created_at", ascending: true }]),
  ]);

  const settings = settingsFromRow(settingsResult.data);
  if (!settings) throw new Error("Your account settings are invalid.");
  const parsed = {
    categories: fromRows.categories(categories),
    transactions: fromRows.transactions(transactions),
    budgets: fromRows.budgets(budgets),
    goals: fromRows.goals(goals),
  };
  const skipped = Object.values(parsed).reduce((n, r) => n + r.invalid, 0);
  return {
    kind: "ready",
    skipped,
    data: {
      categories: parsed.categories.items,
      transactions: parsed.transactions.items,
      budgets: parsed.budgets.items,
      goals: parsed.goals.items,
      settings,
    },
  };
}
