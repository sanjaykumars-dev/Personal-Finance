import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { AmountInput, errorProps, Field, Input, Select } from "@/components/common/FormControls";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import { CURRENCIES } from "@/types";
import { currencySymbol, CURRENCY_LABELS } from "@/utils/format";

const schema = z.object({
  name: z.string().trim().max(40, "Keep it under 40 characters"),
  currency: z.enum(CURRENCIES),
  monthlyIncomeTarget: z
    .number({ invalid_type_error: "Enter a number (0 to disable)" })
    .nonnegative("Can't be negative")
    .max(1_000_000_000, "That amount is too large"),
});

type FormValues = z.infer<typeof schema>;

export function ProfileSection() {
  const name = useSettingsStore((s) => s.name);
  const currency = useSettingsStore((s) => s.currency);
  const monthlyIncomeTarget = useSettingsStore((s) => s.monthlyIncomeTarget);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const toast = useUIStore((s) => s.toast);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name, currency, monthlyIncomeTarget } });

  // Follow external changes (import / reset).
  useEffect(() => {
    reset({ name, currency, monthlyIncomeTarget });
  }, [name, currency, monthlyIncomeTarget, reset]);

  const onSubmit = (values: FormValues) => {
    updateSettings(values);
    toast("Profile saved");
  };

  return (
    <Card>
      <CardHeader title="Profile" description="Personalise the dashboard and choose how amounts are shown." />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="profile-name" error={errors.name?.message}>
            <Input id="profile-name" placeholder="Your name" autoComplete="given-name" {...errorProps("profile-name", errors.name?.message)} {...register("name")} />
          </Field>
          <Field label="Currency" htmlFor="profile-currency">
            <Select id="profile-currency" {...register("currency")}>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {CURRENCY_LABELS[code]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Monthly income target"
          htmlFor="profile-target"
          error={errors.monthlyIncomeTarget?.message}
          hint="Used in insights. Set to 0 to turn off."
          className="sm:max-w-[calc(50%-0.5rem)]"
        >
          <AmountInput
            id="profile-target"
            symbol={currencySymbol(watch("currency"))}
            {...errorProps("profile-target", errors.monthlyIncomeTarget?.message)}
            {...register("monthlyIncomeTarget", { valueAsNumber: true })}
          />
        </Field>
        <div className="flex justify-end">
          <Button variant="primary" type="submit" disabled={!isDirty}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
