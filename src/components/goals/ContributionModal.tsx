import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { AmountInput, errorProps, Field } from "@/components/common/FormControls";
import { Modal } from "@/components/common/Modal";
import { useMoney } from "@/hooks/useMoney";
import { useGoalStore } from "@/store/goalStore";
import { useUIStore } from "@/store/uiStore";
import type { FinancialGoal } from "@/types";
import { goalProgress } from "@/utils/finance";

const schema = z.object({
  amount: z
    .number({ invalid_type_error: "Enter an amount", required_error: "Enter an amount" })
    .positive("Contribution must be greater than zero")
    .max(1_000_000_000, "That amount is too large"),
});

type FormValues = z.infer<typeof schema>;

export function ContributionModal({ goal, onClose }: { goal: FinancialGoal | null; onClose: () => void }) {
  const addContribution = useGoalStore((s) => s.addContribution);
  const toast = useUIStore((s) => s.toast);
  const money = useMoney();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (goal) reset({ amount: Number.NaN });
  }, [goal, reset]);

  const remaining = goal ? goalProgress(goal).remaining : 0;

  const onSubmit = ({ amount }: FormValues) => {
    if (!goal) return;
    addContribution(goal.id, amount);
    toast(amount >= remaining && remaining > 0 ? `🎉 ${goal.name} reached!` : "Goal contribution added");
    onClose();
  };

  const quick = [1000, 5000, 10000].filter((n) => remaining === 0 || n <= remaining);

  return (
    <Modal
      open={goal !== null}
      onClose={onClose}
      title="Add contribution"
      description={goal ? `${goal.name} · ${money.format(remaining)} to go` : undefined}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="contribution-form">
            Add contribution
          </Button>
        </>
      }
    >
      <form id="contribution-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <Field label="Amount" htmlFor="contribution-amount" error={errors.amount?.message}>
          <AmountInput
            id="contribution-amount"
            symbol={money.symbol}
            placeholder="5000"
            autoFocus
            {...errorProps("contribution-amount", errors.amount?.message)}
            {...register("amount", { valueAsNumber: true })}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          {quick.map((n) => (
            <Button key={n} size="sm" onClick={() => setValue("amount", n, { shouldValidate: true })}>
              +{money.format(n)}
            </Button>
          ))}
          {remaining > 0 && (
            <Button size="sm" onClick={() => setValue("amount", remaining, { shouldValidate: true })}>
              Remaining {money.format(remaining)}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
