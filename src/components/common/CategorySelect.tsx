import type { ComponentProps } from "react";
import { useCategories } from "@/hooks/useCategories";
import type { TransactionType } from "@/types";
import { Select } from "./FormControls";

interface CategorySelectProps extends Omit<ComponentProps<"select">, "children"> {
  /** Restrict to one type; omit to show both, grouped. */
  type?: TransactionType;
  placeholder?: string;
  /** IDs to hide (e.g. categories that already have a budget). */
  exclude?: string[];
}

/** Options always come from the user's saved categories. */
export function CategorySelect({ type, placeholder, exclude = [], ...props }: CategorySelectProps) {
  const { ofType } = useCategories();
  const hidden = new Set(exclude);
  const group = (t: TransactionType) => ofType(t).filter((c) => !hidden.has(c.id));

  return (
    <Select {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {type ? (
        group(type).map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))
      ) : (
        <>
          <optgroup label="Expense">
            {group("expense").map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Income">
            {group("income").map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        </>
      )}
    </Select>
  );
}
