import { CategoryIcon } from "@/components/common/CategoryIcon";
import { useCategories } from "@/hooks/useCategories";
import { useMoney } from "@/hooks/useMoney";
import type { Transaction } from "@/types";
import { cn } from "@/utils/cn";
import { relativeDay } from "@/utils/dates";

/** Icon · description · category · date · amount. Used on the dashboard and in mobile lists. */
export function TransactionListItem({ transaction, actions }: { transaction: Transaction; actions?: React.ReactNode }) {
  const { byId, color, name } = useCategories();
  const money = useMoney();
  const category = byId.get(transaction.categoryId);
  return (
    <div className="flex items-center gap-3 py-3">
      <CategoryIcon icon={category?.icon ?? "tag"} color={color(transaction.categoryId)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{transaction.description}</p>
        <p className="truncate text-xs text-muted">
          {name(transaction.categoryId)} · {relativeDay(transaction.date)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className={cn("tabular text-sm font-semibold", transaction.type === "income" ? "text-income" : "text-fg")}>
          {money.signed(transaction.amount, transaction.type)}
        </span>
        {actions}
      </div>
    </div>
  );
}
