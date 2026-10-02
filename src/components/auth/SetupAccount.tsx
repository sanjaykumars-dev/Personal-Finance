import { Database, HardDrive, Sparkles, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { session, useSessionStore, type SetupChoice } from "@/store/cloud/session";
import { cn } from "@/utils/cn";
import { AuthLayout } from "./AuthLayout";

interface Option {
  value: SetupChoice;
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Shown once, the first time someone signs in to a new account. */
export function SetupAccount() {
  const guestData = useSessionStore((s) => s.guestData);
  const email = useSessionStore((s) => s.user?.email);
  const localCount = guestData?.transactions.length ?? 0;
  const [choice, setChoice] = useState<SetupChoice>(localCount > 0 ? "local" : "sample");
  const [busy, setBusy] = useState(false);

  const options: Option[] = [
    ...(localCount > 0
      ? [
          {
            value: "local" as const,
            icon: HardDrive,
            title: "Copy data from this browser",
            description: `${localCount} transaction${localCount === 1 ? "" : "s"}, plus your categories, budgets and goals.`,
          },
        ]
      : []),
    { value: "sample", icon: Sparkles, title: "Start with sample data", description: "Six months of realistic example data to explore." },
    { value: "empty", icon: Database, title: "Start fresh", description: "Default categories only. Add your own transactions." },
  ];

  const submit = async () => {
    setBusy(true);
    await session.completeSetup(choice);
    setBusy(false);
  };

  return (
    <AuthLayout
      title="Set up your account"
      description={
        <>
          Signed in as <span className="font-medium text-fg">{email}</span>. How would you like to start?
        </>
      }
      footer={
        <button type="button" className="text-muted hover:text-fg" onClick={() => void session.signOut(true)}>
          Sign out
        </button>
      }
    >
      <div role="radiogroup" aria-label="Starting data" className="space-y-2">
        {options.map(({ value, icon: Icon, title, description }) => {
          const checked = choice === value;
          return (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                checked ? "border-primary bg-primary-soft" : "border-line hover:border-line-strong",
              )}
            >
              <input type="radio" name="setup-choice" value={value} checked={checked} onChange={() => setChoice(value)} className="sr-only" />
              <Icon className={cn("mt-0.5 size-5 shrink-0", checked ? "text-primary" : "text-muted")} aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-fg">{title}</span>
                <span className="block text-xs text-muted">{description}</span>
              </span>
            </label>
          );
        })}
      </div>
      <Button variant="primary" className="mt-6 w-full" onClick={() => void submit()} disabled={busy}>
        {busy ? "Setting up…" : "Continue"}
      </Button>
      {choice === "local" && <p className="mt-3 text-center text-xs text-subtle">Your browser copy stays here too, for guest mode.</p>}
    </AuthLayout>
  );
}
