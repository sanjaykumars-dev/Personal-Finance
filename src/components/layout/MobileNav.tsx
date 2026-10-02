import { NavLink } from "react-router";
import { cn } from "@/utils/cn";
import { NAV_ITEMS } from "./navigation";

// Settings lives in the mobile top bar so five tabs get enough width.
const MOBILE_ITEMS = NAV_ITEMS.filter((item) => item.to !== "/settings");

export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {MOBILE_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-subtle hover:text-fg",
                )
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="max-w-full truncate px-0.5">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
