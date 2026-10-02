import type { Transaction, TransactionType } from "@/types";
import { lastMonths, monthKey, shiftMonth, toISODate } from "./dates";

export type DatePreset = "all" | "this-month" | "last-month" | "last-3-months" | "this-year" | "custom";
export type SortOrder = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export interface TransactionFilters {
  search: string;
  type: "all" | TransactionType;
  categoryId: string;
  datePreset: DatePreset;
  from: string;
  to: string;
  sort: SortOrder;
}

export const DEFAULT_FILTERS: TransactionFilters = {
  search: "",
  type: "all",
  categoryId: "",
  datePreset: "all",
  from: "",
  to: "",
  sort: "date-desc",
};

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: "All time",
  "this-month": "This month",
  "last-month": "Last month",
  "last-3-months": "Last 3 months",
  "this-year": "This year",
  custom: "Custom range",
};

export const SORT_LABELS: Record<SortOrder, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "amount-desc": "Amount: high to low",
  "amount-asc": "Amount: low to high",
};

/** Inclusive [from, to] ISO date bounds for a preset; empty string = unbounded. */
export function dateRange(filters: TransactionFilters, now = new Date()): { from: string; to: string } {
  const current = monthKey(now);
  switch (filters.datePreset) {
    case "all":
      return { from: "", to: "" };
    case "this-month":
      return { from: `${current}-01`, to: `${current}-31` };
    case "last-month": {
      const last = shiftMonth(current, -1);
      return { from: `${last}-01`, to: `${last}-31` };
    }
    case "last-3-months":
      return { from: `${lastMonths(3, current)[0]}-01`, to: `${current}-31` };
    case "this-year":
      return { from: `${now.getFullYear()}-01-01`, to: toISODate(new Date(now.getFullYear(), 11, 31)) };
    case "custom":
      return { from: filters.from, to: filters.to };
  }
}

export function isFiltered(filters: TransactionFilters): boolean {
  return (
    filters.search.trim() !== "" || filters.type !== "all" || filters.categoryId !== "" || filters.datePreset !== "all"
  );
}

/** ISO dates compare correctly as plain strings. */
export function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function applyFilters(
  transactions: Transaction[],
  filters: TransactionFilters,
  categoryName: (id: string) => string,
): Transaction[] {
  const query = filters.search.trim().toLowerCase();
  const { from, to } = dateRange(filters);
  const result = transactions.filter((t) => {
    if (filters.type !== "all" && t.type !== filters.type) return false;
    if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
    // ISO strings compare correctly as text.
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    if (query) {
      const haystack = `${t.description} ${t.notes ?? ""} ${categoryName(t.categoryId)}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  // The store keeps newest-added first and Array#sort is stable, so same-day
  // entries stay in the order they were recorded.
  const newest = (a: Transaction, b: Transaction) => compareDates(b.date, a.date);
  switch (filters.sort) {
    case "date-desc":
      return result.sort(newest);
    case "date-asc":
      return result.reverse().sort((a, b) => compareDates(a.date, b.date));
    case "amount-desc":
      return result.sort((a, b) => b.amount - a.amount || newest(a, b));
    case "amount-asc":
      return result.sort((a, b) => a.amount - b.amount || newest(a, b));
  }
}
