import type { EnergyStatus } from "@/types/energy";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";

export function DataStatusBadge({ status, label }: { status: EnergyStatus; label?: string }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--brand-green)_10%,white)] border border-[color:var(--brand-green)]/30 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--brand-green)]">
        <CheckCircle2 className="h-3 w-3" /> {label ?? "Date live"}
      </span>
    );
  }
  if (status === "stale") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--brand-sun)_15%,white)] border border-[color:var(--brand-sun)]/40 px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
        <Info className="h-3 w-3" /> {label ?? "Estimare orientativă"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      <AlertTriangle className="h-3 w-3" /> {label ?? "Date indisponibile"}
    </span>
  );
}
