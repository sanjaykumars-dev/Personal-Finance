import type { AppData } from "@/types";
import { appDataSchema } from "./schemas";

const BACKUP_APP = "personal-finance-dashboard";
const BACKUP_VERSION = 1;

export function serializeBackup(data: AppData): string {
  return JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data }, null, 2);
}

/**
 * Validates a backup file end to end: shape (Zod), then relationships, so a
 * restored backup can never reference categories that don't exist.
 */
export function parseBackup(text: string): AppData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("The file is not valid JSON.");
  }
  // Accept both the wrapped export format and a bare data object.
  const payload = typeof raw === "object" && raw !== null && "data" in raw ? raw.data : raw;
  const result = appDataSchema.safeParse(payload);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`This doesn't look like a valid backup${issue ? ` (${issue.path.join(".") || "root"}: ${issue.message})` : ""}.`);
  }
  const data = result.data;
  const categories = new Map(data.categories.map((c) => [c.id, c]));
  if (categories.size !== data.categories.length) throw new Error("The backup contains duplicate category IDs.");
  for (const t of data.transactions) {
    const category = categories.get(t.categoryId);
    if (!category || category.type !== t.type) throw new Error(`Transaction "${t.description}" references a missing category.`);
  }
  for (const b of data.budgets) {
    if (categories.get(b.categoryId)?.type !== "expense") throw new Error("A budget references a missing expense category.");
  }
  if (!data.categories.some((c) => c.type === "income") || !data.categories.some((c) => c.type === "expense")) {
    throw new Error("A backup needs at least one income and one expense category.");
  }
  return data;
}

export function downloadFile(contents: string, filename: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
