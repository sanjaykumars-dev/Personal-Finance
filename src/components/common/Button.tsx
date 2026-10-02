import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover shadow-card",
  secondary: "bg-surface text-fg border border-line hover:bg-surface-hover shadow-card",
  ghost: "text-muted hover:bg-surface-hover hover:text-fg",
  danger: "bg-expense text-white hover:opacity-90 shadow-card dark:text-bg",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  icon: "size-9",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  children?: ReactNode;
}

export function Button({ variant = "secondary", size = "md", icon: Icon, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "danger";
  size?: "sm" | "md";
}

/** Square icon-only button; `label` becomes its accessible name and tooltip. */
export function IconButton({ icon: Icon, label, tone = "default", size = "sm", className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover disabled:opacity-50",
        size === "sm" ? "size-8" : "size-9",
        tone === "danger" ? "hover:text-expense" : "hover:text-fg",
        className,
      )}
      {...rest}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
