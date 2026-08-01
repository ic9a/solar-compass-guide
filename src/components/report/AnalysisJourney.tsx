import { Check, FileSearch, Gauge, ListChecks } from "lucide-react";

const stages = [
  { label: "Citire document", icon: FileSearch },
  { label: "Verificare date", icon: ListChecks },
  { label: "Calculare rezultat", icon: Gauge },
] as const;

export function AnalysisJourney({ active = 0 }: { active?: number }) {
  return (
    <div className="analysis-journey" aria-label="Etapele analizei">
      {stages.map(({ label, icon: Icon }, index) => {
        const done = index < active;
        const current = index === active;
        return (
          <div
            key={label}
            className={done ? "is-done" : current ? "is-current" : undefined}
            aria-current={current ? "step" : undefined}
          >
            <span>{done ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>
            <strong>{label}</strong>
          </div>
        );
      })}
    </div>
  );
}
