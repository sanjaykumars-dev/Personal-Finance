import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, IconButton } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { EmptyState } from "@/components/common/EmptyState";
import { useCategories } from "@/hooks/useCategories";
import { useTransactionStore } from "@/store/transactionStore";
import type { Category, TransactionType } from "@/types";
import { CategoryFormModal } from "./CategoryFormModal";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

const GROUPS: { type: TransactionType; label: string }[] = [
  { type: "expense", label: "Expense" },
  { type: "income", label: "Income" },
];

export function CategoryManager() {
  const { ofType, color } = useCategories();
  const transactions = useTransactionStore((s) => s.transactions);
  const [form, setForm] = useState<{ open: boolean; editing: Category | null; type: TransactionType }>({
    open: false,
    editing: null,
    type: "expense",
  });
  const [deleting, setDeleting] = useState<Category | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + 1);
    return map;
  }, [transactions]);

  return (
    <Card>
      <CardHeader
        title="Categories"
        description="Used by transactions, budgets, filters and charts. Renaming never breaks existing records."
        action={
          <Button size="sm" variant="primary" icon={Plus} onClick={() => setForm({ open: true, editing: null, type: "expense" })}>
            Add Category
          </Button>
        }
      />
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        {GROUPS.map(({ type, label }) => {
          const list = ofType(type);
          return (
            <section key={type} aria-labelledby={`categories-${type}`}>
              <div className="mb-2 flex items-center justify-between">
                <h3 id={`categories-${type}`} className="text-xs font-semibold tracking-wider text-subtle uppercase">
                  {label} <span className="font-normal">({list.length})</span>
                </h3>
                <Button size="sm" variant="ghost" icon={Plus} onClick={() => setForm({ open: true, editing: null, type })}>
                  Add
                </Button>
              </div>
              {list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line">
                  <EmptyState icon={Tags} title={`No ${type} categories`} description={`Add one to record ${type === "income" ? "income" : "expenses"}.`} compact />
                </div>
              ) : (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {list.map((category) => {
                    const count = counts.get(category.id) ?? 0;
                    return (
                      <li key={category.id} className="flex items-center gap-3 px-3 py-2.5">
                        <CategoryIcon icon={category.icon} color={color(category.id)} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-fg">{category.name}</p>
                          <p className="text-xs text-subtle">
                            {count} transaction{count === 1 ? "" : "s"}
                          </p>
                        </div>
                        <IconButton icon={Pencil} label={`Edit ${category.name}`} onClick={() => setForm({ open: true, editing: category, type })} />
                        <IconButton icon={Trash2} label={`Delete ${category.name}`} tone="danger" onClick={() => setDeleting(category)} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <CategoryFormModal open={form.open} editing={form.editing} defaultType={form.type} onClose={() => setForm((f) => ({ ...f, open: false }))} />
      <DeleteCategoryDialog category={deleting} onClose={() => setDeleting(null)} />
    </Card>
  );
}
