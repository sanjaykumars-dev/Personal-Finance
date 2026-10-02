import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Field, Select } from "@/components/common/FormControls";
import { useCategories } from "@/hooks/useCategories";
import { categoryUsage, deleteCategory } from "@/store/actions";
import { useUIStore } from "@/store/uiStore";
import type { Category } from "@/types";

/**
 * Deleting an in-use category requires choosing where its transactions (and
 * budgets) go. There is no path that leaves records pointing at nothing.
 */
export function DeleteCategoryDialog({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const { ofType, name } = useCategories();
  const toast = useUIStore((s) => s.toast);
  const [moveTo, setMoveTo] = useState("");

  const targets = category ? ofType(category.type).filter((c) => c.id !== category.id) : [];
  const usage = category ? categoryUsage(category.id) : { transactions: 0, budgets: 0 };
  const inUse = usage.transactions > 0 || usage.budgets > 0;

  useEffect(() => {
    if (category) {
      const fallback = targets.find((c) => /^other/i.test(c.name)) ?? targets[0];
      setMoveTo(fallback?.id ?? "");
    }
    // Pick a default target each time a new category is selected.
  }, [category]);

  const confirm = () => {
    if (!category) return;
    try {
      deleteCategory(category.id, inUse ? moveTo : undefined);
      toast(inUse ? `${category.name} deleted · records moved to ${name(moveTo)}` : `${category.name} deleted`);
      onClose();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn't delete the category", "error");
    }
  };

  const parts = [
    usage.transactions > 0 && `${usage.transactions} transaction${usage.transactions === 1 ? "" : "s"}`,
    usage.budgets > 0 && `${usage.budgets} budget${usage.budgets === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <ConfirmDialog
      open={category !== null}
      title={`Delete “${category?.name ?? ""}”?`}
      confirmLabel={inUse ? "Move & delete" : "Delete"}
      confirmDisabled={inUse && !moveTo}
      onConfirm={confirm}
      onCancel={onClose}
      message={
        inUse ? (
          <>
            This category is used by <span className="font-medium text-fg">{parts.join(" and ")}</span>. Choose where to move them before deleting.
          </>
        ) : (
          "This category isn't used by any transactions or budgets. It will be removed."
        )
      }
    >
      {inUse &&
        (targets.length > 0 ? (
          <Field label="Move to" htmlFor="move-category">
            <Select id="move-category" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              {targets.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-warning">
            There's no other {category?.type} category to move them to. Create one first, or cancel.
          </p>
        ))}
      {inUse && usage.budgets > 0 && (
        <p className="text-xs text-subtle">If the target already has a budget in the same month, that budget is kept and the moved one is dropped.</p>
      )}
    </ConfirmDialog>
  );
}
