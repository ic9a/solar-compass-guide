import { Check } from "lucide-react";

export interface Step {
  id: number;
  label: string;
}

export function StepProgress({
  steps,
  current,
  onJump,
}: {
  steps: Step[];
  current: number;
  onJump?: (id: number) => void;
}) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold md:hidden">
        <span>
          Pasul {current} din {steps.length}
        </span>
        <span className="text-muted-foreground">
          {steps.find((step) => step.id === current)?.label}
        </span>
      </div>
      <ol className="flex items-center gap-0.5 sm:gap-1.5 md:gap-2">
        {steps.map((s, idx) => {
          const done = s.id < current;
          const active = s.id === current;
          const clickable = onJump && s.id < current;
          return (
            <li key={s.id} className="flex-1 flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(s.id)}
                className={[
                  "flex min-h-10 min-w-8 items-center gap-2 rounded-full transition-colors md:min-w-0",
                  clickable ? "cursor-pointer" : "cursor-default",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid place-items-center h-6 w-6 shrink-0 rounded-full text-[11px] font-bold border transition-colors",
                    done
                      ? "bg-[color:var(--brand-green)] text-white border-[color:var(--brand-green)]"
                      : active
                        ? "bg-white text-[color:var(--brand-green)] border-[color:var(--brand-green)] ring-2 ring-[color:var(--brand-green)]/20"
                        : "bg-muted text-muted-foreground border-transparent",
                  ].join(" ")}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.id}
                </span>
                <span
                  className={`hidden md:inline text-xs font-semibold truncate ${active ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground"}`}
                >
                  {s.label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <span
                  className={`flex-1 h-[2px] rounded-full ${done ? "bg-[color:var(--brand-green)]" : "bg-muted"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
