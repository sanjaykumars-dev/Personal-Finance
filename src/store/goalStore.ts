import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FinancialGoal } from "@/types";
import { createId } from "@/utils/id";
import { goalSchema } from "@/utils/schemas";
import { initialData, persistOptions, STORAGE_KEYS } from "./persistence";

export type GoalInput = Omit<FinancialGoal, "id">;

interface GoalState {
  goals: FinancialGoal[];
  addGoal: (input: GoalInput) => void;
  updateGoal: (id: string, input: GoalInput) => void;
  deleteGoal: (id: string) => void;
  addContribution: (id: string, amount: number) => void;
  setGoals: (goals: FinancialGoal[]) => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      goals: initialData.goals,
      addGoal: (input) => set((s) => ({ goals: [...s.goals, { ...input, name: input.name.trim(), id: createId("goal") }] })),
      updateGoal: (id, input) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...input, name: input.name.trim(), id } : g)) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      addContribution: (id, amount) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g)) })),
      setGoals: (goals) => set({ goals }),
    }),
    persistOptions(STORAGE_KEYS.goals, z.object({ goals: z.array(goalSchema) }), (s) => ({ goals: s.goals })),
  ),
);
