import { Search, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { CategorySelect } from "@/components/common/CategorySelect";
import { Input, SegmentedControl, Select } from "@/components/common/FormControls";
import { useCategories } from "@/hooks/useCategories";
import {
  DATE_PRESET_LABELS,
  DEFAULT_FILTERS,
  isFiltered,
  SORT_LABELS,
  type DatePreset,
  type SortOrder,
  type TransactionFilters,
} from "@/utils/filters";

interface Props {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

const PRESETS = Object.keys(DATE_PRESET_LABELS) as DatePreset[];
const SORTS = Object.keys(SORT_LABELS) as SortOrder[];

export function TransactionFiltersBar({ filters, onChange }: Props) {
  const { byId } = useCategories();
  const set = (patch: Partial<TransactionFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3 border-b border-line p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <Input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search description, notes or category"
            aria-label="Search transactions"
            className="pl-9"
          />
        </div>
        <div className="w-full lg:w-64">
          <SegmentedControl
            name="filter-type"
            label="Filter by type"
            value={filters.type}
            onChange={(type) => {
              // Drop a category filter that no longer matches the chosen type.
              const category = byId.get(filters.categoryId);
              set({ type, categoryId: category && type !== "all" && category.type !== type ? "" : filters.categoryId });
            }}
            options={[
              { value: "all", label: "All" },
              { value: "income", label: "Income", activeClass: "text-income" },
              { value: "expense", label: "Expense", activeClass: "text-expense" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CategorySelect
          aria-label="Filter by category"
          value={filters.categoryId}
          onChange={(e) => set({ categoryId: e.target.value })}
          placeholder="All categories"
          {...(filters.type !== "all" ? { type: filters.type } : {})}
        />
        <Select aria-label="Filter by date" value={filters.datePreset} onChange={(e) => set({ datePreset: e.target.value as DatePreset })}>
          {PRESETS.map((p) => (
            <option key={p} value={p}>
              {DATE_PRESET_LABELS[p]}
            </option>
          ))}
        </Select>
        <Select aria-label="Sort transactions" value={filters.sort} onChange={(e) => set({ sort: e.target.value as SortOrder })}>
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </Select>
        <Button
          variant="ghost"
          icon={X}
          disabled={!isFiltered(filters)}
          onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}
          className="justify-self-start"
        >
          Clear filters
        </Button>
      </div>

      {filters.datePreset === "custom" && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <label className="space-y-1 text-xs font-medium text-muted">
            From
            <Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted">
            To
            <Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value })} />
          </label>
        </div>
      )}
    </div>
  );
}
