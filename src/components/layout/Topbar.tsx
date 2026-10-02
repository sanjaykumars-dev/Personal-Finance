import { Moon, Plus, Settings, Sun } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/utils/cn";
import { Button, IconButton } from "@/components/common/Button";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./navigation";

function useResolvedDark(): boolean {
  const theme = useSettingsStore((s) => s.theme);
  if (theme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return theme === "dark";
}

export function Topbar() {
  const { pathname } = useLocation();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const openAdd = useUIStore((s) => s.openAddTransaction);
  const dark = useResolvedDark();
  const current = NAV_ITEMS.find((item) => (item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)));

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <p className="hidden text-sm font-medium text-muted lg:block">{current?.label ?? ""}</p>
        <div className="ml-auto flex items-center gap-1.5">
          <IconButton
            icon={dark ? Sun : Moon}
            label={dark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => updateSettings({ theme: dark ? "light" : "dark" })}
            size="md"
          />
          <NavLink
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className={({ isActive }) =>
              cn(
                "inline-flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-surface-hover lg:hidden",
                isActive ? "text-primary" : "text-muted hover:text-fg",
              )
            }
          >
            <Settings className="size-4" aria-hidden="true" />
          </NavLink>
          <Button
            variant="primary"
            size="icon"
            icon={Plus}
            aria-label="Add transaction"
            title="Add transaction"
            onClick={() => openAdd()}
            className="lg:hidden"
          />
        </div>
      </div>
    </header>
  );
}
