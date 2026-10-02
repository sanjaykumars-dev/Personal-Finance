import type { z } from "zod";
import { createJSONStorage, type PersistOptions } from "zustand/middleware";
import { createSampleData } from "@/data/sampleData";

export const STORAGE_KEYS = {
  categories: "pfd:categories",
  transactions: "pfd:transactions",
  budgets: "pfd:budgets",
  goals: "pfd:goals",
  settings: "pfd:settings",
} as const;

/** First-launch data, shared by every store so IDs line up. */
export const initialData = createSampleData();

/**
 * Persist options shared by all data stores: JSON in localStorage, and
 * persisted state is validated before it replaces the in-memory defaults.
 */
export function persistOptions<State, Persisted extends Partial<State>>(
  name: string,
  schema: z.ZodType<Persisted>,
  partialize: (state: State) => Persisted,
): PersistOptions<State, Persisted> {
  return {
    name,
    version: 1,
    storage: createJSONStorage(() => localStorage),
    partialize,
    merge: (persisted, current) => {
      const result = schema.safeParse(persisted);
      if (!result.success) {
        if (persisted !== undefined) console.warn(`[storage] Ignoring invalid data in "${name}"`);
        return current;
      }
      return { ...current, ...result.data };
    },
  };
}
