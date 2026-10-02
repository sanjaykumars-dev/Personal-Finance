import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMoney } from "@/hooks/useMoney";
import { formatMonth, formatMonthShort } from "@/utils/dates";
import type { MonthSummary } from "@/utils/finance";
import { ChartTooltip } from "./ChartTooltip";

export function MonthlySpendingChart({ data, height = 280 }: { data: MonthSummary[]; height?: number }) {
  const money = useMoney();
  return (
    <div style={{ height }} role="img" aria-label={`Monthly spending for ${data.length} months`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spending-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthShort}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--subtle)", fontSize: 12 }}
            dy={6}
          />
          <YAxis tickFormatter={money.compact} tickLine={false} axisLine={false} tick={{ fill: "var(--subtle)", fontSize: 12 }} width={56} />
          <Tooltip
            cursor={{ stroke: "var(--line-strong)" }}
            content={({ active, payload, label }) => (
              <ChartTooltip active={active} payload={payload} label={label} formatValue={money.format} formatLabel={formatMonth} />
            )}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Spending"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#spending-fill)"
            dot={{ r: 3.5, fill: "var(--surface)", stroke: "var(--primary)", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
