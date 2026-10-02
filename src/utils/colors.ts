import type { Category } from "@/types";

/**
 * Categorical palette tuned to read on both light and dark surfaces.
 * Order alternates hue families so neighbouring slices stay distinct.
 */
export const CHART_PALETTE = [
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#ec4899", // pink
  "#0ea5e9", // sky
  "#8b5cf6", // violet
  "#22c55e", // green
  "#f97316", // orange
  "#64748b", // slate
  "#e11d48", // rose
  "#84cc16", // lime
  "#06b6d4", // cyan
] as const;

export const INCOME_COLOR = "#10b981";
export const EXPENSE_COLOR = "#f43f5e";

/**
 * A category keeps the same colour everywhere (charts, legends, lists):
 * it's derived from its position within its type, which only changes when
 * categories are added or removed.
 */
export function categoryColor(categoryId: string, categories: Category[]): string {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return CHART_PALETTE[8];
  const index = categories.filter((c) => c.type === category.type).findIndex((c) => c.id === categoryId);
  return CHART_PALETTE[index % CHART_PALETTE.length] ?? CHART_PALETTE[0];
}
