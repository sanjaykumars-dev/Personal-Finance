import { Pencil, Plus, Receipt, SearchX, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, IconButton } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { TransactionFiltersBar } from "@/components/transactions/TransactionFiltersBar";
import { TransactionListItem } from "@/components/transactions/TransactionListItem";
import { useCategories } from "@/hooks/useCategories";
import { useMoney } from "@/hooks/useMoney";
import { useTransactionStore } from "@/store/transactionStore";
import { useUIStore } from "@/store/uiStore";
import type { Transaction } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/dates";
import { sumBy } from "@/utils/finance";
import { applyFilters, DEFAULT_FILTERS, isFiltered, type TransactionFilters } from "@/utils/filters";

const PAGE_SIZE = 25;

export default function TransactionsPage() {
  const transactions = useTransactionStore((s) => s.transactions);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const openAdd = useUIStore((s) => s.openAddTransaction);
  const openEdit = useUIStore((s) => s.openEditTransaction);
  const toast = useUIStore((s) => s.toast);
  const { byId, color, name } = useCategories();
  const money = useMoney();

  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const filtered = useMemo(() => applyFilters(transactions, filters, name), [transactions, filters, name]);
  const shown = filtered.slice(0, visible);
  const income = sumBy(filtered, "income");
  const expense = sumBy(filtered, "expense");

  const changeFilters = (next: TransactionFilters) => {
    setFilters(next);
    setVisible(PAGE_SIZE);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteTransaction(pendingDelete.id);
    toast("Transaction deleted");
    setPendingDelete(null);
  };

  const rowActions = (t: Transaction) => (
    <>
      <IconButton icon={Pencil} label={`Edit ${t.description}`} onClick={() => openEdit(t)} />
      <IconButton icon={Trash2} label={`Delete ${t.description}`} tone="danger" onClick={() => setPendingDelete(t)} />
    </>
  );

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every income and expense, searchable and filterable."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => openAdd()}>
            Add Transaction
          </Button>
        }
      />

      {transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Add your first transaction, or import a CSV from Settings → Data management."
            action={
              <Button variant="primary" icon={Plus} onClick={() => openAdd()}>
                Add Transaction
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <TransactionFiltersBar filters={filters} onChange={changeFilters} />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line px-4 py-2.5 text-xs text-muted">
            <span>
              <span className="font-semibold text-fg">{filtered.length}</span> transaction{filtered.length === 1 ? "" : "s"}
            </span>
            <span>
              Income <span className="tabular font-semibold text-income">{money.format(income)}</span>
            </span>
            <span>
              Expenses <span className="tabular font-semibold text-expense">{money.format(expense)}</span>
            </span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matching transactions"
              description="Try a different search term or clear the filters."
              action={
                isFiltered(filters) ? (
                  <Button onClick={() => changeFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}>Clear filters</Button>
                ) : undefined
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs font-medium tracking-wide text-subtle uppercase">
                      <th scope="col" className="py-3 pr-3 pl-5 font-medium">Description</th>
                      <th scope="col" className="px-3 py-3 font-medium">Category</th>
                      <th scope="col" className="px-3 py-3 font-medium">Date</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Amount</th>
                      <th scope="col" className="py-3 pr-5 pl-3 text-right font-medium">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {shown.map((t) => (
                      <tr key={t.id} className="group transition-colors hover:bg-surface-hover/60">
                        <td className="py-3 pr-3 pl-5">
                          <div className="flex items-center gap-3">
                            <CategoryIcon icon={byId.get(t.categoryId)?.icon ?? "tag"} color={color(t.categoryId)} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-fg">{t.description}</p>
                              {t.notes && <p className="max-w-xs truncate text-xs text-subtle">{t.notes}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted">{name(t.categoryId)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-muted">{formatDate(t.date)}</td>
                        <td
                          className={cn(
                            "tabular px-3 py-3 text-right font-semibold whitespace-nowrap",
                            t.type === "income" ? "text-income" : "text-fg",
                          )}
                        >
                          {money.signed(t.amount, t.type)}
                        </td>
                        <td className="py-3 pr-5 pl-3">
                          <div className="flex justify-end gap-0.5 opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            {rowActions(t)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-line px-4 md:hidden">
                {shown.map((t) => (
                  <li key={t.id}>
                    <TransactionListItem transaction={t} actions={<div className="ml-1 flex">{rowActions(t)}</div>} />
                  </li>
                ))}
              </ul>

              {filtered.length > visible && (
                <div className="flex justify-center border-t border-line p-4">
                  <Button onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Show more ({filtered.length - visible} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete transaction?"
        message={
          pendingDelete && (
            <>
              <span className="font-medium text-fg">{pendingDelete.description}</span> (
              {money.signed(pendingDelete.amount, pendingDelete.type)} on {formatDate(pendingDelete.date)}) will be permanently removed.
            </>
          )
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
