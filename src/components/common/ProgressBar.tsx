import { cn } from "@/utils/cn";

type Tone = "primary" | "income" | "warning" | "expense";

const TONES: Record<Tone, string> = {
  primary: "bg-primary",
  income: "bg-income",
  warning: "bg-warning",
  expense: "bg-expense",
};

interface ProgressBarProps {
  /** 0–100; values above 100 render full. */
  value: number;
  tone?: Tone;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressBar({ value, tone = "primary", label, size = "md", className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-valuetext={`${value.toFixed(1)}%`}
      className={cn("w-full overflow-hidden rounded-full bg-surface-muted", size === "sm" ? "h-1.5" : "h-2.5", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", TONES[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
