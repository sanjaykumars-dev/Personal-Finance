import type { Category, Transaction, TransactionType } from "@/types";
import { DEFAULT_ICON } from "./icons";

const HEADERS = ["date", "type", "description", "amount", "category", "notes"] as const;

function escapeCell(value: string): string {
  // Neutralise spreadsheet formula injection, then quote if needed.
  const safe = /^[=+\-@\t\r]/.test(value) && !/^-?\d/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function transactionsToCSV(transactions: Transaction[], categories: Category[]): string {
  const nameOf = new Map(categories.map((c) => [c.id, c.name]));
  const rows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [t.date, t.type, t.description, String(t.amount), nameOf.get(t.categoryId) ?? "", t.notes ?? ""]);
  return [HEADERS.join(","), ...rows.map((row) => row.map(escapeCell).join(","))].join("\r\n");
}

/** RFC 4180-style parser: quoted fields, escaped quotes, CRLF/LF, newlines inside quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export interface CSVImportResult {
  transactions: Omit<Transaction, "id">[];
  newCategories: Omit<Category, "id">[];
  skipped: { line: number; reason: string }[];
}

function normaliseDate(value: string): string | null {
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v);
  if (dmy) return `${dmy[3]}-${dmy[2]?.padStart(2, "0")}-${dmy[1]?.padStart(2, "0")}`;
  return null;
}

function isValidDate(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * Converts CSV rows into transactions. Categories are matched by name and type
 * (case-insensitive); unknown names become new categories, returned separately
 * so the caller can create them and resolve IDs. Bad rows are skipped and reported.
 */
export function parseTransactionsCSV(text: string, categories: Category[]): CSVImportResult {
  const rows = parseCSV(text);
  const header = rows[0]?.map((h) => h.trim().toLowerCase()) ?? [];
  const index = (name: (typeof HEADERS)[number]) => header.indexOf(name);
  const missing = (["date", "type", "description", "amount", "category"] as const).filter((h) => index(h) === -1);
  if (missing.length > 0) {
    throw new Error(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Expected: ${HEADERS.join(", ")}.`);
  }

  const result: CSVImportResult = { transactions: [], newCategories: [], skipped: [] };
  const key = (name: string, type: TransactionType) => `${type}:${name.trim().toLowerCase()}`;
  const known = new Map(categories.map((c) => [key(c.name, c.type), c.id]));
  const pending = new Map<string, string>();

  rows.slice(1).forEach((row, i) => {
    const line = i + 2;
    const get = (name: (typeof HEADERS)[number]) => (index(name) >= 0 ? (row[index(name)] ?? "").trim() : "");
    const type = get("type").toLowerCase();
    const date = normaliseDate(get("date"));
    const amount = Number(get("amount").replace(/[^\d.-]/g, ""));
    const description = get("description");
    const categoryName = get("category") || (type === "income" ? "Other Income" : "Other");

    if (type !== "income" && type !== "expense") return result.skipped.push({ line, reason: `type must be "income" or "expense"` });
    if (!date || !isValidDate(date)) return result.skipped.push({ line, reason: "invalid date" });
    if (!Number.isFinite(amount) || amount <= 0) return result.skipped.push({ line, reason: "amount must be a positive number" });
    if (!description) return result.skipped.push({ line, reason: "description is required" });

    const k = key(categoryName, type);
    let categoryId = known.get(k) ?? pending.get(k);
    if (!categoryId) {
      // Placeholder resolved by the caller once the category is created.
      categoryId = `pending:${k}`;
      pending.set(k, categoryId);
      result.newCategories.push({ name: categoryName.slice(0, 40), type, icon: DEFAULT_ICON });
    }
    const notes = get("notes");
    result.transactions.push({
      type,
      date,
      amount: Math.round(amount * 100) / 100,
      description: description.slice(0, 80),
      categoryId,
      ...(notes ? { notes: notes.slice(0, 200) } : {}),
    });
  });

  return result;
}

export function pendingCategoryKey(category: Omit<Category, "id">): string {
  return `pending:${category.type}:${category.name.trim().toLowerCase()}`;
}
