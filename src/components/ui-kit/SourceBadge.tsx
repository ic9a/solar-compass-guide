import { Database, WifiOff, MapPin } from "lucide-react";

export function SourceBadge({ source }: { source: "PVGIS" | "Estimare locală" | "Date live indisponibile" | string }) {
  const Icon = source === "PVGIS" ? Database : source.includes("indisponibil") ? WifiOff : MapPin;
  const tone =
    source === "PVGIS"
      ? "text-[color:var(--brand-green)] bg-[color-mix(in_oklab,var(--brand-green)_10%,white)] border-[color:var(--brand-green)]/25"
      : source.includes("indisponibil")
      ? "text-[color:var(--danger)] bg-[color-mix(in_oklab,var(--danger)_8%,white)] border-[color:var(--danger)]/25"
      : "text-foreground/70 bg-muted border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
      <Icon className="h-3 w-3" /> {source}
    </span>
  );
}
