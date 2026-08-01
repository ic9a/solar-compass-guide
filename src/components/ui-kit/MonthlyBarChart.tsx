const MONTHS = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"];

export function MonthlyBarChart({
  values,
  unit = "kWh",
  height = 180,
}: {
  values: number[]; // length 12
  unit?: string;
  height?: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className="w-full">
      <div
        className="grid gap-1 items-end"
        style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", height }}
      >
        {values.map((v, i) => {
          const h = (v / max) * 100;
          const isPeak = v >= max * 0.85;
          return (
            <div key={i} className="relative flex items-end justify-center h-full group">
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max(4, h)}%`,
                  background: isPeak
                    ? "linear-gradient(180deg, var(--brand-sun) 0%, var(--brand-green) 100%)"
                    : "linear-gradient(180deg, color-mix(in oklab, var(--brand-green) 55%, white) 0%, var(--brand-green) 100%)",
                }}
                title={`${MONTHS[i]}: ${v.toLocaleString("ro-RO")} ${unit}`}
              />
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded bg-foreground text-background text-[10px] px-1.5 py-0.5 whitespace-nowrap z-10">
                {v.toLocaleString("ro-RO")} {unit}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="mt-1.5 grid gap-1 text-[10px] font-medium text-muted-foreground text-center"
        style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
      >
        {MONTHS.map((m) => <div key={m}>{m}</div>)}
      </div>
    </div>
  );
}
