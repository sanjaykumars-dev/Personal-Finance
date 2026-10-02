import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings } from "@/types";
import { settingsSchema } from "@/utils/schemas";
import { initialData, persistOptions, STORAGE_KEYS } from "./persistence";

interface SettingsState extends Settings {
  updateSettings: (patch: Partial<Settings>) => void;
  setSettings: (settings: Settings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialData.settings,
      updateSettings: (patch) => set(patch),
      setSettings: (settings) => set(settings),
    }),
    persistOptions(STORAGE_KEYS.settings, settingsSchema, (s) => ({
      name: s.name,
      currency: s.currency,
      monthlyIncomeTarget: s.monthlyIncomeTarget,
      theme: s.theme,
    })),
  ),
);
