import { useMemo, useRef, useState } from "react";
import type { PvgisMonthly } from "@/services/pvgisService";

const MONTHS = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

type Props = {
  values: PvgisMonthly[];
};

export function MonthlyProductionChart({ values }: Props) {
  const peakMonthIndex = useMemo(
    () =>
      values.reduce(
        (bestIndex, item, index) =>
          item.productionKwh > (values[bestIndex]?.productionKwh ?? -1) ? index : bestIndex,
        0,
      ),
    [values],
  );
  const [selectedMonth, setSelectedMonth] = useState(peakMonthIndex);
  const barRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const keyboardNavigationRef = useRef(false);
  const selectionLockedRef = useRef(false);
  const max = Math.max(...values.map((item) => item.productionKwh), 1);
  const selected = values[selectedMonth] ?? values[peakMonthIndex];

  const moveFocus = (index: number) => {
    const nextIndex = (index + values.length) % values.length;
    keyboardNavigationRef.current = true;
    selectionLockedRef.current = true;
    setSelectedMonth(nextIndex);
    barRefs.current[nextIndex]?.focus();
    window.requestAnimationFrame(() => {
      keyboardNavigationRef.current = false;
    });
  };

  return (
    <figure
      className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/6 p-3 backdrop-blur md:rounded-[2rem] md:p-8"
      aria-labelledby="monthly-chart-title"
      data-testid="monthly-production-chart"
    >
      <figcaption id="monthly-chart-title" className="sr-only">
        Producția lunară estimată în kWh. Selectează o lună pentru valoarea exactă.
      </figcaption>
      <div
        className="mb-3 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-center text-sm font-semibold text-white md:mb-5 md:text-base"
        aria-live="polite"
        data-testid="selected-month-summary"
      >
        {MONTHS[(selected?.month ?? 1) - 1]} ·{" "}
        {(selected?.productionKwh ?? 0).toLocaleString("ro-RO")} kWh
      </div>
      <div className="flex h-[220px] min-w-0 items-end gap-1 md:h-[350px] md:gap-3">
        {values.map((item, index) => {
          const height = Math.max(5, (item.productionKwh / max) * 100);
          const isSelected = selectedMonth === index;
          const month = MONTHS[item.month - 1];
          return (
            <div key={item.month} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="relative flex-1">
                <button
                  ref={(element) => {
                    barRefs.current[index] = element;
                  }}
                  type="button"
                  onPointerEnter={(event) => {
                    if (
                      event.pointerType === "mouse" &&
                      !keyboardNavigationRef.current &&
                      !selectionLockedRef.current
                    ) {
                      setSelectedMonth(index);
                    }
                  }}
                  onClick={() => {
                    selectionLockedRef.current = true;
                    setSelectedMonth(index);
                  }}
                  onFocus={() => setSelectedMonth(index)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                      event.preventDefault();
                      moveFocus(index + 1);
                    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                      event.preventDefault();
                      moveFocus(index - 1);
                    } else if (event.key === "Home") {
                      event.preventDefault();
                      moveFocus(0);
                    } else if (event.key === "End") {
                      event.preventDefault();
                      moveFocus(values.length - 1);
                    }
                  }}
                  aria-label={`${month}: ${item.productionKwh.toLocaleString("ro-RO")} kWh`}
                  aria-pressed={isSelected}
                  data-month={month}
                  className={`absolute inset-x-0 bottom-0 min-h-8 rounded-t-lg bg-gradient-to-t from-[#35b779] to-[#f4c95d] outline-none transition-[height,filter,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#102a2b] ${
                    isSelected
                      ? "brightness-110 shadow-[inset_0_0_0_2px_rgba(255,255,255,.85)]"
                      : "hover:brightness-110"
                  }`}
                  style={{ height: `${height}%` }}
                >
                  <span
                    className={`absolute inset-x-0 top-1 block text-center text-[8px] font-extrabold leading-none ${
                      isSelected ? "text-[#102a2b]" : "sr-only"
                    }`}
                    aria-hidden="true"
                  >
                    {item.productionKwh}
                  </span>
                </button>
              </div>
              <div
                className={`mt-2 truncate text-center text-[8px] font-semibold sm:text-[10px] md:mt-3 ${
                  isSelected
                    ? "text-white underline decoration-2 underline-offset-4"
                    : "text-white/60"
                }`}
                aria-hidden="true"
              >
                {month.slice(0, 3)}
              </div>
            </div>
          );
        })}
      </div>
      <details className="mt-4 text-sm text-white/75">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold">
          Vezi toate valorile lunare
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[16rem] text-left text-xs">
            <thead>
              <tr>
                <th className="py-2 pr-3">Luna</th>
                <th className="py-2">Producție</th>
              </tr>
            </thead>
            <tbody>
              {values.map((item) => (
                <tr key={item.month} className="border-t border-white/10">
                  <td className="py-2 pr-3">{MONTHS[item.month - 1]}</td>
                  <td className="py-2">{item.productionKwh.toLocaleString("ro-RO")} kWh</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
