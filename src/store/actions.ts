import { createEmptyData, createSampleData } from "@/data/sampleData";
import type { AppData } from "@/types";
import { useBudgetStore } from "./budgetStore";
import { useCategoryStore } from "./categoryStore";
import { useGoalStore } from "./goalStore";
import { STORAGE_KEYS } from "./persistence";
import { useSettingsStore } from "./settingsStore";
import { useTransactionStore } from "./transactionStore";

/** How many records reference a category; deleting it requires a move target when > 0. */
export function categoryUsage(categoryId: string): { transactions: number; budgets: number } {
  return {
    transactions: useTransactionStore.getState().transactions.filter((t) => t.categoryId === categoryId).length,
    budgets: useBudgetStore.getState().budgets.filter((b) => b.categoryId === categoryId).length,
  };
}

/**
 * Deletes a category without orphaning anything: referencing transactions
 * and budgets are moved to `moveToId` first. Throws if references exist and
 * no valid target is given, so callers can never silently break data.
 */
export function deleteCategory(categoryId: string, moveToId?: string): void {
  const { categories, removeCategory } = useCategoryStore.getState();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return;
  const usage = categoryUsage(categoryId);
  if (usage.transactions > 0 || usage.budgets > 0) {
    const target = categories.find((c) => c.id === moveToId);
    if (!target || target.id === categoryId || target.type !== category.type) {
      throw new Error("A category of the same type is required to move existing records.");
    }
    useTransactionStore.getState().reassignCategory(categoryId, target.id);
    useBudgetStore.getState().reassignCategory(categoryId, target.id);
  }
  removeCategory(categoryId);
}

export function getAppData(): AppData {
  const s = useSettingsStore.getState();
  return {
    categories: useCategoryStore.getState().categories,
    transactions: useTransactionStore.getState().transactions,
    budgets: useBudgetStore.getState().budgets,
    goals: useGoalStore.getState().goals,
    settings: { name: s.name, currency: s.currency, monthlyIncomeTarget: s.monthlyIncomeTarget, theme: s.theme },
  };
}

export function replaceAppData(data: AppData): void {
  useCategoryStore.getState().setCategories(data.categories);
  useTransactionStore.getState().setTransactions(data.transactions);
  useBudgetStore.getState().setBudgets(data.budgets);
  useGoalStore.getState().setGoals(data.goals);
  useSettingsStore.getState().setSettings(data.settings);
}

/** Clears everything but keeps the default categories and the current theme. */
export function resetApplication(): void {
  const theme = useSettingsStore.getState().theme;
  const empty = createEmptyData();
  replaceAppData({ ...empty, settings: { ...empty.settings, theme } });
}

export function restoreSampleData(): void {
  const theme = useSettingsStore.getState().theme;
  const sample = createSampleData();
  replaceAppData({ ...sample, settings: { ...sample.settings, theme } });
}

/**
 * Zustand only writes to storage on change. Writing once on startup pins the
 * first-launch sample data, so it doesn't regenerate on the next visit.
 */
export function persistInitialState(): void {
  try {
    const writers: [string, () => void][] = [
      [STORAGE_KEYS.categories, () => useCategoryStore.setState({})],
      [STORAGE_KEYS.transactions, () => useTransactionStore.setState({})],
      [STORAGE_KEYS.budgets, () => useBudgetStore.setState({})],
      [STORAGE_KEYS.goals, () => useGoalStore.setState({})],
      [STORAGE_KEYS.settings, () => useSettingsStore.setState({})],
    ];
    for (const [key, write] of writers) {
      if (localStorage.getItem(key) === null) write();
    }
  } catch {
    // Storage unavailable (private mode / blocked): the app still works in memory.
  }
}
