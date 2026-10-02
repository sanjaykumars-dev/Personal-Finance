import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { CategorySelect } from "@/components/common/CategorySelect";
import { AmountInput, errorProps, Field, Input, SegmentedControl, Textarea } from "@/components/common/FormControls";
import { Modal } from "@/components/common/Modal";
import { useCategories } from "@/hooks/useCategories";
import { useMoney } from "@/hooks/useMoney";
import { useTransactionStore } from "@/store/transactionStore";
import { useUIStore } from "@/store/uiStore";
import type { Transaction, TransactionType } from "@/types";
import { todayISO } from "@/utils/dates";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().trim().min(1, "Enter a description").max(80, "Keep it under 80 characters"),
  amount: z
    .number({ invalid_type_error: "Enter an amount", required_error: "Enter an amount" })
    .positive("Amount must be greater than zero")
    .max(1_000_000_000, "That amount is too large"),
  categoryId: z.string().min(1, "Choose a category"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  notes: z.string().max(200, "Keep notes under 200 characters"),
});

type FormValues = z.infer<typeof schema>;

const FORM_ID = "transaction-form";

function defaults(editing: Transaction | null, type: TransactionType, firstCategory: (t: TransactionType) => string): FormValues {
  if (editing) {
    return {
      type: editing.type,
      description: editing.description,
      amount: editing.amount,
      categoryId: editing.categoryId,
      date: editing.date,
      notes: editing.notes ?? "",
    };
  }
  return { type, description: "", amount: Number.NaN, categoryId: firstCategory(type), date: todayISO(), notes: "" };
}

export function TransactionFormModal() {
  const { open, editing, defaultType } = useUIStore((s) => s.transactionModal);
  const close = useUIStore((s) => s.closeTransactionModal);
  const toast = useUIStore((s) => s.toast);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const { ofType, byId } = useCategories();
  const { symbol } = useMoney();
  const firstCategory = (t: TransactionType) => ofType(t)[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults(null, "expense", firstCategory) });

  // Re-seed the form each time the modal opens.
  useEffect(() => {
    if (open) reset(defaults(editing, defaultType, firstCategory));
    // Intentionally keyed on open/target only, not on category list changes.
  }, [open, editing, defaultType, reset]);

  const type = useWatch({ control, name: "type" });

  // Keep the category consistent with the selected type.
  useEffect(() => {
    const current = byId.get(getValues("categoryId"));
    if (!current || current.type !== type) setValue("categoryId", ofType(type)[0]?.id ?? "");
  }, [type, byId, ofType, getValues, setValue]);

  const onSubmit = (values: FormValues) => {
    // The store trims text and drops empty notes.
    if (editing) {
      updateTransaction(editing.id, values);
      toast("Transaction updated");
    } else {
      addTransaction(values);
      toast("Transaction added");
    }
    close();
  };

  const noCategories = ofType(type).length === 0;

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? "Edit transaction" : "Add transaction"}
      description={editing ? undefined : "Record income or an expense. It's saved instantly."}
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" type="submit" form={FORM_ID} disabled={isSubmitting || noCategories}>
            {editing ? "Save changes" : "Add Transaction"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-fg">Type</span>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SegmentedControl
                name="transaction-type"
                label="Transaction type"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "expense", label: "Expense", activeClass: "text-expense" },
                  { value: "income", label: "Income", activeClass: "text-income" },
                ]}
              />
            )}
          />
        </div>

        <Field label="Description" htmlFor="txn-description" error={errors.description?.message}>
          <Input
            id="txn-description"
            placeholder={type === "income" ? "e.g. Salary" : "e.g. Grocery Shopping"}
            autoComplete="off"
            {...errorProps("txn-description", errors.description?.message)}
            {...register("description")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" htmlFor="txn-amount" error={errors.amount?.message}>
            <AmountInput
              id="txn-amount"
              symbol={symbol}
              placeholder="0"
              {...errorProps("txn-amount", errors.amount?.message)}
              {...register("amount", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Date" htmlFor="txn-date" error={errors.date?.message}>
            <Input id="txn-date" type="date" {...errorProps("txn-date", errors.date?.message)} {...register("date")} />
          </Field>
        </div>

        <Field
          label="Category"
          htmlFor="txn-category"
          error={noCategories ? `Create a ${type} category in Settings first.` : errors.categoryId?.message}
        >
          <CategorySelect
            id="txn-category"
            type={type}
            {...errorProps("txn-category", errors.categoryId?.message)}
            {...register("categoryId")}
          />
        </Field>

        <Field label="Notes" htmlFor="txn-notes" error={errors.notes?.message} hint="Optional">
          <Textarea id="txn-notes" rows={2} placeholder="e.g. Weekly groceries" {...register("notes")} />
        </Field>
      </form>
    </Modal>
  );
}
