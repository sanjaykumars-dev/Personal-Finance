interface TooltipEntry {
  name?: string | number | undefined;
  value?: unknown;
  color?: string | undefined;
}

interface ChartTooltipProps {
  active?: boolean | undefined;
  label?: string | number | undefined;
  payload?: readonly TooltipEntry[] | undefined;
  formatValue: (value: number) => string;
  formatLabel?: (label: string) => string;
}

export function ChartTooltip({ active, label, payload, formatValue, formatLabel }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="min-w-36 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      {label !== undefined && label !== "" && (
        <p className="mb-1.5 font-medium text-fg">{formatLabel ? formatLabel(String(label)) : String(label)}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
              {entry.name}
            </span>
            <span className="tabular font-medium text-fg">{formatValue(Number(entry.value ?? 0))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
