import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export type VisualChoiceOption<T extends string> = {
  value: T;
  title: string;
  description?: string;
  icon: LucideIcon;
  badge?: string;
  detail?: ReactNode;
};

type VisualChoiceCardProps = {
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  illustration?: ReactNode;
  title: string;
  description?: string;
  badge?: string;
  detail?: ReactNode;
  disabled?: boolean;
  multi?: boolean;
  testId?: string;
};

export function VisualChoiceCard({
  selected,
  onClick,
  icon: Icon,
  illustration,
  title,
  description,
  badge,
  detail,
  disabled = false,
  multi = false,
  testId,
}: VisualChoiceCardProps) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      data-selected={selected ? "true" : "false"}
      className={`group relative flex min-h-[5.75rem] w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:color-mix(in_oklab,var(--brand-green)_24%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-[color:var(--brand-green)] bg-green-50 shadow-[0_0_0_1px_var(--brand-green)]"
          : "border-border/80 bg-white hover:border-[color:color-mix(in_oklab,var(--brand-green)_45%,var(--border))] hover:bg-[#fbfcfa]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center rounded-xl ${illustration ? "h-20 w-28" : "h-10 w-10"} ${
          selected
            ? "bg-[color:var(--brand-green)] text-white"
            : "bg-brand-green-soft text-[color:var(--brand-green)]"
        }`}
      >
        {illustration ?? (Icon ? <Icon className="h-5 w-5" strokeWidth={2} /> : null)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold leading-5">{title}</span>
          {badge && (
            <span className="rounded-full bg-brand-sun-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7c5300]">
              {badge}
            </span>
          )}
        </span>
        {description && (
          <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
            {description}
          </span>
        )}
        {detail && <span className="mt-2 block text-xs text-muted-foreground">{detail}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
          selected
            ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)] text-white"
            : "border-border bg-white text-transparent"
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    </button>
  );
}
