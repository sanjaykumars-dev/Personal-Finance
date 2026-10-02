import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { CategorySelect } from "@/components/common/CategorySelect";
import { AmountInput, errorProps, Field } from "@/components/common/FormControls";
import { Modal } from "@/components/common/Modal";
import { useCategories } from "@/hooks/useCategories";
import { useMoney } from "@/hooks/useMoney";
import { useBudgetStore } from "@/store/budgetStore";
import { useUIStore } from "@/store/uiStore";
import type { Budget } from "@/types";
import { formatMonth } from "@/utils/dates";

const schema = z.object({
  categoryId: z.string().min(1, "Choose a category"),
  limit: z
    .number({ invalid_type_error: "Enter a monthly limit", required_error: "Enter a monthly limit" })
    .positive("Limit must be greater than zero")
    .max(1_000_000_000, "That amount is too large"),
});

type FormValues = z.infer<typeof schema>;

interface BudgetFormModalProps {
  open: boolean;
  month: string;
  editing: Budget | null;
  onClose: () => void;
}

export function BudgetFormModal({ open, month, editing, onClose }: BudgetFormModalProps) {
  const budgets = useBudgetStore((s) => s.budgets);
  const addBudget = useBudgetStore((s) => s.addBudget);
  const updateBudget = useBudgetStore((s) => s.updateBudget);
  const toast = useUIStore((s) => s.toast);
  const { ofType, name } = useCategories();
  const { symbol } = useMoney();

  // One budget per category per month.
  const taken = budgets.filter((b) => b.month === month && b.id !== editing?.id).map((b) => b.categoryId);
  const available = ofType("expense").filter((c) => !taken.includes(c.id));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset(editing ? { categoryId: editing.categoryId, limit: editing.limit } : { categoryId: available[0]?.id ?? "", limit: Number.NaN });
    // Seed only when the modal opens.
  }, [open, editing]);

  const onSubmit = (values: FormValues) => {
    if (editing) {
      updateBudget(editing.id, { ...values, month: editing.month });
      toast("Budget updated");
    } else {
      addBudget({ ...values, month });
      toast(`${name(values.categoryId)} budget created`);
    }
    onClose();
  };

  const full = !editing && available.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit budget" : "Add budget"}
      description={`Monthly limit for ${formatMonth(editing?.month ?? month)}`}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="budget-form" disabled={full}>
            {editing ? "Save changes" : "Add budget"}
          </Button>
        </>
      }
    >
      {full ? (
        <p className="text-sm text-muted">Every expense category already has a budget this month. Add a new category in Settings to budget for it.</p>
      ) : (
        <form id="budget-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Category" htmlFor="budget-category" error={errors.categoryId?.message}>
            <CategorySelect
              id="budget-category"
              type="expense"
              exclude={taken}
              {...errorProps("budget-category", errors.categoryId?.message)}
              {...register("categoryId")}
            />
          </Field>
          <Field label="Monthly limit" htmlFor="budget-limit" error={errors.limit?.message}>
            <AmountInput
              id="budget-limit"
              symbol={symbol}
              placeholder="10000"
              {...errorProps("budget-limit", errors.limit?.message)}
              {...register("limit", { valueAsNumber: true })}
            />
          </Field>
        </form>
      )}
    </Modal>
  );
}
