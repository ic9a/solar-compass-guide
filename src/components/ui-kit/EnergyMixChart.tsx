import type { EnergySnapshot } from "@/types/energy";

const COLORS: Record<string, string> = {
  "Fotovoltaic":   "var(--brand-sun)",
  "Eolian":        "oklch(0.72 0.14 205)",
  "Hidro":         "oklch(0.68 0.13 220)",
  "Nuclear":       "oklch(0.65 0.16 300)",
  "Cărbune":       "oklch(0.45 0.03 60)",
  "Hidrocarburi":  "oklch(0.60 0.14 45)",
  "Biomasă":       "oklch(0.60 0.14 130)",
};

export function EnergyMixChart({ snapshot }: { snapshot: EnergySnapshot }) {
  const rows = [
    { label: "Fotovoltaic",  mw: snapshot.solarMw ?? 0 },
    { label: "Eolian",       mw: snapshot.windMw ?? 0 },
    { label: "Hidro",        mw: snapshot.hydroMw ?? 0 },
    { label: "Nuclear",      mw: snapshot.nuclearMw ?? 0 },
    { label: "Cărbune",      mw: snapshot.coalMw ?? 0 },
    { label: "Hidrocarburi", mw: snapshot.hydrocarbonsMw ?? 0 },
    { label: "Biomasă",      mw: snapshot.biomassMw ?? 0 },
  ].filter((r) => r.mw > 0);

  const total = rows.reduce((a, r) => a + r.mw, 0) || 1;

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full border border-border/60">
        {rows.map((r) => (
          <div
            key={r.label}
            style={{ width: `${(r.mw / total) * 100}%`, background: COLORS[r.label] }}
            title={`${r.label}: ${r.mw.toLocaleString("ro-RO")} MW (${Math.round((r.mw / total) * 100)}%)`}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2 min-w-0">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: COLORS[r.label] }} />
            <span className="truncate">{r.label}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">
              {Math.round((r.mw / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
