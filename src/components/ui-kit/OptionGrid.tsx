import type { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { OptionCard } from "./OptionCard";

export interface Option<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: LucideIcon;
  isOther?: boolean;
}

interface Base<T extends string> {
  options: Option<T>[];
  cols?: 1 | 2 | 3 | 4;
  otherText?: string;
  onOtherTextChange?: (v: string) => void;
  otherPlaceholder?: string;
  compact?: boolean;
}

interface Single<T extends string> extends Base<T> {
  multi?: false;
  value: T | undefined;
  onChange: (v: T) => void;
}
interface Multi<T extends string> extends Base<T> {
  multi: true;
  value: T[];
  onChange: (v: T[]) => void;
}

export function OptionGrid<T extends string>(props: Single<T> | Multi<T>) {
  const { options, cols = 2, otherText, onOtherTextChange, otherPlaceholder = "Detaliază aici…", compact } = props;
  const [localOther, setLocalOther] = useState(otherText ?? "");
  useEffect(() => { if (otherText !== undefined) setLocalOther(otherText); }, [otherText]);

  const isSelected = (v: T) =>
    props.multi ? props.value.includes(v) : props.value === v;

  const toggle = (v: T) => {
    if (props.multi) {
      const set = new Set(props.value);
      if (set.has(v)) set.delete(v); else set.add(v);
      props.onChange(Array.from(set) as T[]);
    } else {
      props.onChange(v);
    }
  };

  const otherSelected = options.some((o) => o.isOther && isSelected(o.value));

  const colClass =
    cols === 1 ? "grid-cols-1" :
    cols === 4 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" :
    cols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
    "grid-cols-1 sm:grid-cols-2";

  return (
    <div className="space-y-3">
      <div className={`grid gap-2.5 ${colClass}`}>
        {options.map((o) => (
          <OptionCard
            key={o.value}
            icon={o.icon}
            title={o.label}
            description={o.description}
            selected={isSelected(o.value)}
            onClick={() => toggle(o.value)}
            compact={compact}
          />
        ))}
      </div>
      {otherSelected && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="block">
            <span className="block text-xs font-semibold text-muted-foreground mb-1.5">Detaliază</span>
            <input
              type="text"
              autoFocus
              value={localOther}
              onChange={(e) => { setLocalOther(e.target.value); onOtherTextChange?.(e.target.value); }}
              placeholder={otherPlaceholder}
              className="w-full rounded-lg border border-[color:var(--brand-green)]/40 bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-green)]"
            />
          </label>
        </div>
      )}
    </div>
  );
}
