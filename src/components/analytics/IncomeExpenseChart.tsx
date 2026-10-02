import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMoney } from "@/hooks/useMoney";
import { EXPENSE_COLOR, INCOME_COLOR } from "@/utils/colors";
import { formatMonth, formatMonthShort } from "@/utils/dates";
import type { MonthSummary } from "@/utils/finance";
import { ChartTooltip } from "./ChartTooltip";

interface IncomeExpenseChartProps {
  data: MonthSummary[];
  height?: number;
}

export function IncomeExpenseChart({ data, height = 280 }: IncomeExpenseChartProps) {
  const money = useMoney();
  return (
    <div style={{ height }} role="img" aria-label={`Income and expenses for ${data.length} months`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthShort}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--subtle)", fontSize: 12 }}
            dy={6}
          />
          <YAxis
            tickFormatter={money.compact}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--subtle)", fontSize: 12 }}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-hover)" }}
            content={({ active, payload, label }) => (
              <ChartTooltip active={active} payload={payload} label={label} formatValue={money.format} formatLabel={formatMonth} />
            )}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => <span style={{ color: "var(--muted)" }}>{value}</span>}
          />
          <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Expenses" fill={EXPENSE_COLOR} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
