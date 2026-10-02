import { Monitor, Moon, Sun } from "lucide-react";
import { Card, CardHeader } from "@/components/common/Card";
import { useSettingsStore } from "@/store/settingsStore";
import type { ThemePreference } from "@/types";
import { cn } from "@/utils/cn";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function AppearanceSection() {
  const theme = useSettingsStore((s) => s.theme);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <Card>
      <CardHeader title="Appearance" description="System follows your device's light or dark setting." />
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3 p-5">
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const checked = theme === value;
          return (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                checked ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:border-line-strong hover:text-fg",
              )}
            >
              <input type="radio" name="theme" value={value} checked={checked} onChange={() => updateSettings({ theme: value })} className="sr-only" />
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </label>
          );
        })}
      </div>
    </Card>
  );
}
