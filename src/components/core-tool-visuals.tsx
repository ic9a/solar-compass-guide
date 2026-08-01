import { BatteryCharging, FileSearch, Home, MapPinned, PanelsTopLeft, Zap } from "lucide-react";

const wizardStories = [
  { icon: Zap, label: "Consum", text: "Pornim de la energia folosită acum." },
  {
    icon: BatteryCharging,
    label: "Viitor",
    text: "Separăm consumatorii actuali de cei planificați.",
  },
  { icon: MapPinned, label: "Locație", text: "Legăm casa de profilul solar local." },
  { icon: PanelsTopLeft, label: "Acoperiș", text: "Orientarea și umbrirea rămân explicite." },
  { icon: Home, label: "Obiectiv", text: "Comparăm sistemul cu felul în care vei folosi energia." },
  { icon: FileSearch, label: "Recomandare", text: "Primești intervale, limite și pașii următori." },
] as const;

export function WizardStepStory({ step }: { step: number }) {
  const story = wizardStories[Math.max(0, Math.min(wizardStories.length - 1, step - 1))];
  const Icon = story.icon;
  return (
    <div className="tool-story" aria-live="polite">
      <div className="tool-story__scene" aria-hidden="true">
        <div className="tool-story__sun" />
        <div className="tool-story__house">
          <i />
          <i />
          <i />
        </div>
        <Icon className="tool-story__icon" />
        <span className="tool-story__flow" />
      </div>
      <p>
        Pasul {step} din 6 · {story.label}
      </p>
      <strong>{story.text}</strong>
    </div>
  );
}

export function OfferDocumentVisual() {
  return (
    <div className="offer-tool-visual" role="img" aria-label="Ofertă verificată punct cu punct">
      <div className="offer-tool-visual__paper">
        <span>OFERTĂ FOTOVOLTAICĂ</span>
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="offer-tool-visual__lens">
        <FileSearch aria-hidden="true" />
      </div>
      <div className="offer-tool-visual__checks">
        <b>Preț</b>
        <b>Echipamente</b>
        <b>Garanții</b>
      </div>
    </div>
  );
}
