import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Budget } from "@/types";
import { createId } from "@/utils/id";
import { budgetSchema } from "@/utils/schemas";
import { initialData, persistOptions, STORAGE_KEYS } from "./persistence";

interface BudgetState {
  budgets: Budget[];
  addBudget: (input: Omit<Budget, "id">) => void;
  updateBudget: (id: string, input: Omit<Budget, "id">) => void;
  deleteBudget: (id: string) => void;
  /** Copies every budget of `fromMonth` into `toMonth`, skipping categories already budgeted. */
  copyMonth: (fromMonth: string, toMonth: string) => number;
  /**
   * Moves budgets to another category. If the target already has a budget
   * for the same month, the target's budget wins and the moved one is dropped.
   */
  reassignCategory: (fromId: string, toId: string) => void;
  setBudgets: (budgets: Budget[]) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: initialData.budgets,
      addBudget: (input) => set((s) => ({ budgets: [...s.budgets, { ...input, id: createId("bud") }] })),
      updateBudget: (id, input) => set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? { ...input, id } : b)) })),
      deleteBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),
      copyMonth: (fromMonth, toMonth) => {
        const existing = new Set(get().budgets.filter((b) => b.month === toMonth).map((b) => b.categoryId));
        const copies = get()
          .budgets.filter((b) => b.month === fromMonth && !existing.has(b.categoryId))
          .map((b) => ({ ...b, id: createId("bud"), month: toMonth }));
        set((s) => ({ budgets: [...s.budgets, ...copies] }));
        return copies.length;
      },
      reassignCategory: (fromId, toId) =>
        set((s) => {
          const targetMonths = new Set(s.budgets.filter((b) => b.categoryId === toId).map((b) => b.month));
          return {
            budgets: s.budgets.flatMap((b) => {
              if (b.categoryId !== fromId) return [b];
              return targetMonths.has(b.month) ? [] : [{ ...b, categoryId: toId }];
            }),
          };
        }),
      setBudgets: (budgets) => set({ budgets }),
    }),
    persistOptions(STORAGE_KEYS.budgets, z.object({ budgets: z.array(budgetSchema) }), (s) => ({ budgets: s.budgets })),
  ),
);
