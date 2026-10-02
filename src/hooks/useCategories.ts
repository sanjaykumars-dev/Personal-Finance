import { useMemo } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import type { Category, TransactionType } from "@/types";
import { categoryColor } from "@/utils/colors";

export interface CategoryLookup {
  categories: Category[];
  byId: Map<string, Category>;
  ofType: (type: TransactionType) => Category[];
  name: (id: string) => string;
  color: (id: string) => string;
}

/** Categories plus memoized lookups. Everything that shows a category name resolves it here, by ID. */
export function useCategories(): CategoryLookup {
  const categories = useCategoryStore((s) => s.categories);
  return useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    return {
      categories,
      byId,
      ofType: (type) => categories.filter((c) => c.type === type),
      name: (id) => byId.get(id)?.name ?? "Uncategorized",
      color: (id) => categoryColor(id, categories),
    };
  }, [categories]);
}
