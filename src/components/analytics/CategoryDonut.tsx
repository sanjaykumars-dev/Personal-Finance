import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useCategories } from "@/hooks/useCategories";
import { useMoney } from "@/hooks/useMoney";
import type { CategoryTotal } from "@/utils/finance";
import { ChartTooltip } from "./ChartTooltip";

interface CategoryDonutProps {
  data: CategoryTotal[];
  /** Max legend rows; the rest are grouped as "Others". */
  maxSlices?: number;
  centerLabel?: string;
}

/** Donut + legend. Slices and colours come from the user's categories. */
export function CategoryDonut({ data, maxSlices = 6, centerLabel = "Total" }: CategoryDonutProps) {
  const { name, color } = useCategories();
  const money = useMoney();
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  const head = data.slice(0, maxSlices).map((d) => ({ key: d.categoryId, name: name(d.categoryId), value: d.amount, color: color(d.categoryId) }));
  const rest = data.slice(maxSlices);
  const slices =
    rest.length > 0
      ? [...head, { key: "others", name: "Others", value: rest.reduce((s, d) => s + d.amount, 0), color: "var(--subtle)" }]
      : head;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative size-44 shrink-0" role="img" aria-label={`Spending split across ${data.length} categories`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" isAnimationActive={false}>
              {slices.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  payload={payload.map((p) => ({ name: p.name, value: p.value, color: typeof p.payload === "object" && p.payload && "color" in p.payload ? String(p.payload.color) : undefined }))}
                  formatValue={money.format}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-subtle">{centerLabel}</span>
          <span className="tabular text-base font-semibold text-fg">{money.compact(total)}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2.5 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-muted">{slice.name}</span>
            <span className="tabular font-medium text-fg">{money.format(slice.value)}</span>
            <span className="tabular w-10 text-right text-xs text-subtle">{total > 0 ? Math.round((slice.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
