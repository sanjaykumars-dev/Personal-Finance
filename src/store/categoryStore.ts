import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "@/types";
import { createId } from "@/utils/id";
import { categorySchema } from "@/utils/schemas";
import { initialData, persistOptions, STORAGE_KEYS } from "./persistence";

interface CategoryState {
  categories: Category[];
  addCategory: (input: Omit<Category, "id">) => Category;
  updateCategory: (id: string, input: Partial<Omit<Category, "id">>) => void;
  /** Use deleteCategory in store/actions.ts, which also handles references. */
  removeCategory: (id: string) => void;
  setCategories: (categories: Category[]) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      categories: initialData.categories,
      addCategory: (input) => {
        const category = { ...input, name: input.name.trim(), id: createId("cat") };
        set((s) => ({ categories: [...s.categories, category] }));
        return category;
      },
      updateCategory: (id, input) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...input, ...(input.name !== undefined ? { name: input.name.trim() } : {}) } : c,
          ),
        })),
      removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
      setCategories: (categories) => set({ categories }),
    }),
    persistOptions(STORAGE_KEYS.categories, z.object({ categories: z.array(categorySchema) }), (s) => ({
      categories: s.categories,
    })),
  ),
);
