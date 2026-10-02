import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Toaster } from "@/components/common/Toaster";
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal";
import { useThemeEffect } from "@/hooks/useTheme";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NAV_ITEMS } from "./navigation";

function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-surface-muted" />
    </div>
  );
}

export function AppLayout() {
  useThemeEffect();
  const { pathname } = useLocation();

  useEffect(() => {
    const item = NAV_ITEMS.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));
    document.title = item ? `${item.label} · Personal Finance` : "Personal Finance";
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-3 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNav />
      <TransactionFormModal />
      <Toaster />
    </div>
  );
}
