import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/cn";

const CONTROL =
  "w-full rounded-lg border border-line bg-surface text-sm text-fg shadow-card transition-colors placeholder:text-subtle hover:border-line-strong focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20 disabled:opacity-60 aria-invalid:border-expense aria-invalid:focus:ring-expense/20";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint/error, wired for screen readers via `${htmlFor}-error`. */
export function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-expense">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-subtle">{hint}</p>
      )}
    </div>
  );
}

/** aria props for a control inside <Field>. */
export function errorProps(id: string, error: string | undefined) {
  return error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, "h-10 px-3", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "min-h-20 resize-y px-3 py-2", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, "h-10 appearance-none pr-9 pl-3", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
    </div>
  );
}

interface AmountInputProps extends ComponentProps<"input"> {
  symbol: string;
}

export function AmountInput({ symbol, className, ...props }: AmountInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">{symbol}</span>
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        className={cn("tabular", className)}
        style={{ paddingLeft: `${Math.max(2, symbol.length * 0.55 + 1.4)}rem` }}
        {...props}
      />
    </div>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  activeClass?: string;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
}

/** Radio group styled as a segmented control. */
export function SegmentedControl<T extends string>({ name, value, options, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-surface-muted p-1">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex h-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
              checked ? cn("bg-surface shadow-card", option.activeClass ?? "text-fg") : "text-muted hover:text-fg",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
