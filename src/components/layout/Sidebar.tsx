import { Plus } from "lucide-react";
import { NavLink } from "react-router";
import { AccountCard } from "@/components/auth/AccountCard";
import { Button } from "@/components/common/Button";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/utils/cn";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./navigation";

export function Sidebar() {
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

      <AccountCard />
    </aside>
  );
}
