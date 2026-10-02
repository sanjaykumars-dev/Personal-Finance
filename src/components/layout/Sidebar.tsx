import { HardDrive, Plus } from "lucide-react";
import { NavLink } from "react-router";
import { Button } from "@/components/common/Button";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/utils/cn";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./navigation";

export function Sidebar() {
  const name = useSettingsStore((s) => s.name);
  const openAdd = useUIStore((s) => s.openAddTransaction);

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <Button variant="primary" icon={Plus} className="mt-6 w-full" onClick={() => openAdd()}>
        Add Transaction
      </Button>

      <nav aria-label="Main" className="mt-6 flex-1">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    isActive ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-hover hover:text-fg",
                  )
                }
              >
                <Icon className="size-4.5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="rounded-xl bg-surface-muted p-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary" aria-hidden="true">
            {(name.trim()[0] ?? "Y").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{name.trim() || "You"}</p>
            <p className="flex items-center gap-1 text-xs text-subtle">
              <HardDrive className="size-3" aria-hidden="true" />
              Stored in this browser
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
