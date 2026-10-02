import { useMemo } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import type { TransactionType } from "@/types";
import { currencySymbol, formatCompactCurrency, formatCurrency, formatSignedCurrency } from "@/utils/format";

/** Currency formatters bound to the user's chosen currency. */
export function useMoney() {
  const currency = useSettingsStore((s) => s.currency);
  return useMemo(
    () => ({
      currency,
      symbol: currencySymbol(currency),
      format: (amount: number) => formatCurrency(amount, currency),
      compact: (amount: number) => formatCompactCurrency(amount, currency),
      signed: (amount: number, type: TransactionType) => formatSignedCurrency(amount, type, currency),
    }),
    [currency],
  );
}
