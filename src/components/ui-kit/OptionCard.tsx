import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

export interface OptionCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export function OptionCard({
  icon: Icon,
  title,
  description,
  selected = false,
  onClick,
  disabled,
  compact = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        "group relative w-full text-left rounded-xl border transition-all outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-green)]",
        compact ? "p-3" : "p-4",
        selected
          ? "border-[color:var(--brand-green)] bg-[color-mix(in_oklab,var(--brand-green)_6%,white)] shadow-soft"
          : "border-border/70 bg-surface hover:border-[color:var(--brand-green)]/50 hover:bg-muted/40",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {selected && (
        <span className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-[color:var(--brand-green)] text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span
            className={[
              "grid place-items-center shrink-0 rounded-lg transition-colors",
              compact ? "h-8 w-8" : "h-10 w-10",
              selected
                ? "bg-[color:var(--brand-green)] text-white"
                : "bg-[color-mix(in_oklab,var(--brand-green)_10%,white)] text-[color:var(--brand-green)] group-hover:bg-[color-mix(in_oklab,var(--brand-green)_16%,white)]",
            ].join(" ")}
          >
            <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className={`font-semibold text-foreground ${compact ? "text-sm" : "text-sm md:text-[15px]"}`}>
            {title}
          </div>
          {description && (
            <div className="mt-0.5 text-xs text-muted-foreground leading-snug">
              {description}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
