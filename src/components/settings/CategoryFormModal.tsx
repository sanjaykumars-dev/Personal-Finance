import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { errorProps, Field, Input, SegmentedControl } from "@/components/common/FormControls";
import { Modal } from "@/components/common/Modal";
import { useCategories } from "@/hooks/useCategories";
import { categoryUsage } from "@/store/actions";
import { useCategoryStore } from "@/store/categoryStore";
import { useUIStore } from "@/store/uiStore";
import type { Category, TransactionType } from "@/types";
import { cn } from "@/utils/cn";
import { CATEGORY_ICONS, DEFAULT_ICON, ICON_KEYS } from "@/utils/icons";

const schema = z.object({
  name: z.string().trim().min(1, "Enter a category name").max(40, "Keep it under 40 characters"),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface CategoryFormModalProps {
  open: boolean;
  editing: Category | null;
  defaultType: TransactionType;
  onClose: () => void;
}

export function CategoryFormModal({ open, editing, defaultType, onClose }: CategoryFormModalProps) {
  const addCategory = useCategoryStore((s) => s.addCategory);
  const updateCategory = useCategoryStore((s) => s.updateCategory);
  const toast = useUIStore((s) => s.toast);
  const { categories } = useCategories();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset(editing ? { name: editing.name, type: editing.type, icon: editing.icon } : { name: "", type: defaultType, icon: DEFAULT_ICON });
  }, [open, editing, defaultType, reset]);

  // A category's type is locked once records use it; changing it would mislabel them.
  const usage = editing ? categoryUsage(editing.id) : { transactions: 0, budgets: 0 };
  const typeLocked = usage.transactions > 0 || usage.budgets > 0;

  const onSubmit = (values: FormValues) => {
    const duplicate = categories.some(
      (c) => c.id !== editing?.id && c.type === values.type && c.name.trim().toLowerCase() === values.name.trim().toLowerCase(),
    );
    if (duplicate) {
      setError("name", { message: `You already have a ${values.type} category with this name` });
      return;
    }
    if (editing) {
      updateCategory(editing.id, typeLocked ? { name: values.name, icon: values.icon } : values);
      toast(editing.name !== values.name.trim() ? `Renamed to ${values.name.trim()}` : "Category updated");
    } else {
      addCategory(values);
      toast("Category created");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit category" : "New category"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="category-form">
            {editing ? "Save changes" : "Create category"}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Name" htmlFor="category-name" error={errors.name?.message}>
          <Input id="category-name" placeholder="e.g. Groceries" autoComplete="off" {...errorProps("category-name", errors.name?.message)} {...register("name")} />
        </Field>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-fg">Type</span>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <fieldset disabled={typeLocked} className="disabled:opacity-60">
                <SegmentedControl
                  name="category-type"
                  label="Category type"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "expense", label: "Expense", activeClass: "text-expense" },
                    { value: "income", label: "Income", activeClass: "text-income" },
                  ]}
                />
              </fieldset>
            )}
          />
          {typeLocked && <p className="text-xs text-subtle">The type can't change while transactions or budgets use this category.</p>}
        </div>

        <div className="space-y-1.5">
          <span id="icon-label" className="block text-sm font-medium text-fg">
            Icon
          </span>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <div role="radiogroup" aria-labelledby="icon-label" className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
                {ICON_KEYS.map((key) => {
                  const Icon = CATEGORY_ICONS[key];
                  if (!Icon) return null;
                  const checked = field.value === key;
                  return (
                    <label
                      key={key}
                      title={key.replace(/-/g, " ")}
                      className={cn(
                        "flex aspect-square cursor-pointer items-center justify-center rounded-lg border transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                        checked ? "border-primary bg-primary-soft text-primary" : "border-transparent text-muted hover:bg-surface-hover hover:text-fg",
                      )}
                    >
                      <input
                        type="radio"
                        name="category-icon"
                        value={key}
                        checked={checked}
                        onChange={() => field.onChange(key)}
                        className="sr-only"
                        aria-label={key.replace(/-/g, " ")}
                      />
                      <Icon className="size-4.5" aria-hidden="true" />
                    </label>
                  );
                })}
              </div>
            )}
          />
        </div>
      </form>
    </Modal>
  );
}
