import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { AmountInput, errorProps, Field, Input } from "@/components/common/FormControls";
import { Modal } from "@/components/common/Modal";
import { useMoney } from "@/hooks/useMoney";
import { useGoalStore } from "@/store/goalStore";
import { useUIStore } from "@/store/uiStore";
import type { FinancialGoal } from "@/types";
import { toISODate } from "@/utils/dates";

const amount = (label: string) =>
  z.number({ invalid_type_error: `Enter the ${label}`, required_error: `Enter the ${label}` }).max(1_000_000_000, "That amount is too large");

const schema = z.object({
  name: z.string().trim().min(1, "Give your goal a name").max(60, "Keep it under 60 characters"),
  targetAmount: amount("target amount").positive("Target must be greater than zero"),
  currentAmount: amount("amount saved so far").nonnegative("Can't be negative"),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a target date"),
});

type FormValues = z.infer<typeof schema>;

function defaultTargetDate(): string {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 7, 0));
}

interface GoalFormModalProps {
  open: boolean;
  editing: FinancialGoal | null;
  onClose: () => void;
}

export function GoalFormModal({ open, editing, onClose }: GoalFormModalProps) {
  const addGoal = useGoalStore((s) => s.addGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const toast = useUIStore((s) => s.toast);
  const { symbol } = useMoney();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? { name: editing.name, targetAmount: editing.targetAmount, currentAmount: editing.currentAmount, targetDate: editing.targetDate }
        : { name: "", targetAmount: Number.NaN, currentAmount: 0, targetDate: defaultTargetDate() },
    );
  }, [open, editing, reset]);

  const onSubmit = (values: FormValues) => {
    if (editing) {
      updateGoal(editing.id, values);
      toast("Goal updated");
    } else {
      addGoal(values);
      toast("Goal created");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit goal" : "New savings goal"}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="goal-form">
            {editing ? "Save changes" : "Create goal"}
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Goal name" htmlFor="goal-name" error={errors.name?.message}>
          <Input id="goal-name" placeholder="e.g. Emergency Fund" autoComplete="off" {...errorProps("goal-name", errors.name?.message)} {...register("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target amount" htmlFor="goal-target" error={errors.targetAmount?.message}>
            <AmountInput
              id="goal-target"
              symbol={symbol}
              placeholder="100000"
              {...errorProps("goal-target", errors.targetAmount?.message)}
              {...register("targetAmount", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Current amount" htmlFor="goal-current" error={errors.currentAmount?.message}>
            <AmountInput
              id="goal-current"
              symbol={symbol}
              {...errorProps("goal-current", errors.currentAmount?.message)}
              {...register("currentAmount", { valueAsNumber: true })}
            />
          </Field>
        </div>
        <Field label="Target date" htmlFor="goal-date" error={errors.targetDate?.message}>
          <Input id="goal-date" type="date" {...errorProps("goal-date", errors.targetDate?.message)} {...register("targetDate")} />
        </Field>
      </form>
    </Modal>
  );
}
