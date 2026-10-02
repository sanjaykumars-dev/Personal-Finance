import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";

interface AuthLayoutProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centered card used by login, password reset and account setup screens. */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <main className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
          {description && <div className="mt-1.5 text-sm text-muted">{description}</div>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </main>
    </div>
  );
}

export function FullScreenMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center" role="status" aria-live="polite">
      <span className="size-8 animate-spin rounded-full border-[3px] border-primary border-r-transparent" aria-hidden="true" />
      <p className="text-sm font-medium text-fg">{title}</p>
      {children}
    </div>
  );
}
