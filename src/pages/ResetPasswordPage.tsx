import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { AuthLayout, FullScreenMessage } from "@/components/auth/AuthLayout";
import { Button } from "@/components/common/Button";
import { errorProps, Field, Input } from "@/components/common/FormControls";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/store/cloud/session";
import { useUIStore } from "@/store/uiStore";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

type FormValues = z.infer<typeof schema>;

/** Landing page for the email reset link. Supabase signs the user in from the link first. */
export default function ResetPasswordPage() {
  const phase = useSessionStore((s) => s.phase);
  const user = useSessionStore((s) => s.user);
  const toast = useUIStore((s) => s.toast);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (phase === "initializing") return <FullScreenMessage title="Checking your reset link…" />;

  if (!supabase || !user) {
    return (
      <AuthLayout title="Link expired or invalid" description="Password reset links can only be used once and expire after a while.">
        <Link to="/login" className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-fg hover:bg-primary-hover">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  const onSubmit = async ({ password }: FormValues) => {
    if (!supabase) return;
    setError(null);
    const result = await supabase.auth.updateUser({ password });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    toast("Password updated");
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout title="Choose a new password" description={<>For {user.email}</>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="New password" htmlFor="new-password" error={errors.password?.message} hint="At least 8 characters.">
          <Input id="new-password" type="password" autoComplete="new-password" {...errorProps("new-password", errors.password?.message)} {...register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm-password" error={errors.confirm?.message}>
          <Input id="confirm-password" type="password" autoComplete="new-password" {...errorProps("confirm-password", errors.confirm?.message)} {...register("confirm")} />
        </Field>
        {error && (
          <p className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense" role="alert">
            {error}
          </p>
        )}
        <Button variant="primary" type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
