import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "green",
  children,
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "green" | "sun" | "neutral";
  children?: ReactNode;
}) {
  const iconBg =
    accent === "sun"
      ? "bg-[color-mix(in_oklab,var(--brand-sun)_18%,white)] text-[color:var(--brand-sun)]"
      : accent === "neutral"
        ? "bg-muted text-muted-foreground"
        : "bg-[color-mix(in_oklab,var(--brand-green)_12%,white)] text-[color:var(--brand-green)]";
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-card p-3 shadow-soft sm:p-4">
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
        {Icon && (
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9 ${iconBg}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 break-words text-base font-bold leading-tight text-foreground sm:text-lg md:text-xl">
            {value}
          </div>
          {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
