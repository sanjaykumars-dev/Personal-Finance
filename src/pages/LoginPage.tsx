import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/common/Button";
import { errorProps, Field, Input } from "@/components/common/FormControls";
import { OAUTH_PROVIDERS, supabase, type OAuthProvider } from "@/lib/supabase";
import { session, useSessionStore } from "@/store/cloud/session";
import { cn } from "@/utils/cn";

type Mode = "sign-in" | "sign-up" | "forgot";

const email = z.string().trim().min(1, "Enter your email").email("Enter a valid email address");

const schemas = {
  "sign-in": z.object({ email, password: z.string().min(1, "Enter your password") }),
  "sign-up": z.object({ email, password: z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters") }),
  forgot: z.object({ email, password: z.string() }),
};

type FormValues = { email: string; password: string };

const COPY: Record<Mode, { title: string; description: string; submit: string }> = {
  "sign-in": { title: "Welcome back", description: "Sign in to sync your finances across devices.", submit: "Sign in" },
  "sign-up": { title: "Create your account", description: "Your data is saved to your account and available on any device.", submit: "Create account" },
  forgot: { title: "Reset your password", description: "We'll email you a link to choose a new password.", submit: "Send reset link" },
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14a6.6 6.6 0 0 1 0-4.2V7H2a11 11 0 0 0 0 9.9l3.7-2.9Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7l3.7 2.9C6.6 7.3 9 5.4 12 5.4Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

/** Supabase surfaces network failures as "Failed to fetch"; make them readable. */
function friendly(message: string): string {
  if (/failed to fetch|network|load failed/i.test(message)) return "Couldn't reach the server. Check your connection and try again.";
  if (/confirm/i.test(message)) return "Please confirm your email first. Check your inbox for the link.";
  return message;
}

const PROVIDER_LABEL: Record<OAuthProvider, string> = { google: "Google", github: "GitHub" };

export default function LoginPage() {
  const phase = useSessionStore((s) => s.phase);
  const navigate = useNavigate();
  const location = useLocation();
  const from = typeof location.state === "object" && location.state && "from" in location.state ? String(location.state.from) : "/";

  const [mode, setMode] = useState<Mode>("sign-in");
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<{ email: string; kind: "confirm" | "reset" } | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schemas[mode]), defaultValues: { email: "", password: "" } });

  // Already in (or not using accounts at all): go to the app.
  if (!supabase || phase === "local-only" || phase === "guest" || phase === "loading" || phase === "ready" || phase === "needs-setup" || phase === "error") {
    return <Navigate to={from} replace />;
  }

  const switchMode = (next: Mode) => {
    setMode(next);
    setFormError(null);
    setSentTo(null);
    clearErrors();
  };

  const onSubmit = async ({ email: address, password }: FormValues) => {
    if (!supabase) return;
    setBusy(true);
    setFormError(null);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email: address, password });
        if (error) {
          setFormError(friendly(error.message));
        }
        // On success, the auth listener loads the account and this page redirects.
      } else if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) setFormError(friendly(error.message));
        else if (!data.session) setSentTo({ email: address, kind: "confirm" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) setFormError(friendly(error.message));
        else setSentTo({ email: address, kind: "reset" });
      }
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const resendConfirmation = async () => {
    if (!supabase || !sentTo) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: sentTo.email, options: { emailRedirectTo: window.location.origin } });
    setFormError(error ? friendly(error.message) : null);
  };

  const oauth = async (provider: OAuthProvider) => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (error) setFormError(friendly(error.message));
  };

  const guestFooter = (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-hover"
        onClick={() => {
          session.continueAsGuest();
          navigate(from, { replace: true });
        }}
      >
        Continue without an account
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </button>
      <p className="mt-1 text-xs text-subtle">Try it with sample data. Everything stays in this browser.</p>
    </>
  );

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox" footer={guestFooter}>
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <MailCheck className="size-5.5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm text-muted">
            {sentTo.kind === "confirm" ? "We sent a confirmation link to " : "If an account exists for "}
            <span className="font-medium text-fg">{sentTo.email}</span>
            {sentTo.kind === "confirm" ? ". Open it to finish creating your account." : ", you'll receive a link to reset your password."}
          </p>
          {formError && <p className="mt-3 text-sm text-expense" role="alert">{formError}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {sentTo.kind === "confirm" && <Button onClick={() => void resendConfirmation()}>Resend email</Button>}
            <Button variant="primary" onClick={() => switchMode("sign-in")}>
              Back to sign in
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const copy = COPY[mode];

  return (
    <AuthLayout title={copy.title} description={copy.description} footer={guestFooter}>
      {mode !== "forgot" && (
        <div role="tablist" aria-label="Account" className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1">
          {(["sign-in", "sign-up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                "h-9 rounded-lg text-sm font-medium transition-colors",
                mode === m ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
              )}
            >
              {m === "sign-in" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      )}

      {mode !== "forgot" && OAUTH_PROVIDERS.length > 0 && (
        <>
          <div className="grid gap-2">
            {OAUTH_PROVIDERS.map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => void oauth(provider)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-surface text-sm font-medium text-fg shadow-card transition-colors hover:bg-surface-hover"
              >
                {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
                Continue with {PROVIDER_LABEL[provider]}
              </button>
            ))}
          </div>
          <div className="my-5 flex items-center gap-3 text-xs text-subtle">
            <span className="h-px flex-1 bg-line" />
            or with email
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Email" htmlFor="auth-email" error={errors.email?.message}>
          <Input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" {...errorProps("auth-email", errors.email?.message)} {...register("email")} />
        </Field>
        {mode !== "forgot" && (
          <Field
            label="Password"
            htmlFor="auth-password"
            error={errors.password?.message}
            hint={mode === "sign-up" ? "At least 8 characters." : undefined}
          >
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              {...errorProps("auth-password", errors.password?.message)}
              {...register("password")}
            />
          </Field>
        )}

        {formError && (
          <p className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense" role="alert">
            {formError}
          </p>
        )}

        <Button variant="primary" type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : copy.submit}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        {mode === "sign-in" && (
          <button type="button" className="text-muted hover:text-fg" onClick={() => switchMode("forgot")}>
            Forgot your password?
          </button>
        )}
        {mode === "forgot" && (
          <button
            type="button"
            className="text-muted hover:text-fg"
            onClick={() => switchMode("sign-in")}
          >
            Back to sign in
          </button>
        )}
      </div>
    </AuthLayout>
  );
}
