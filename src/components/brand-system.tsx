import type { ReactNode } from "react";

export function MarketingPageHero({
  eyebrow,
  title,
  description,
  visual,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  visual?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="brand-page-hero">
      <div className="brand-page-hero__sun" aria-hidden="true" />
      <div className="brand-shell brand-page-hero__grid">
        <div className="brand-page-hero__copy">
          <p className="home-v2-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          {children && <div className="brand-page-hero__actions">{children}</div>}
        </div>
        {visual && <div className="brand-page-hero__visual">{visual}</div>}
      </div>
    </header>
  );
}

export function SectionIntro({
  number,
  eyebrow,
  title,
  description,
}: {
  number?: string;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="brand-section-intro">
      {(number || eyebrow) && <p>{number || eyebrow}</p>}
      <h2>{title}</h2>
      {description && <div>{description}</div>}
    </div>
  );
}

export function BrandSurface({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: "light" | "green" | "sun" | "paper";
  className?: string;
}) {
  return <div className={`brand-surface brand-surface--${tone} ${className}`}>{children}</div>;
}

export function PageState({
  kind,
  title,
  description,
  action,
}: {
  kind: "loading" | "empty" | "error" | "success";
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={`brand-state brand-state--${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span className="brand-state__mark" aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {action}
      </div>
    </div>
  );
}

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`brand-reveal ${className}`}>{children}</div>;
}

export function JourneyScene({ kind }: { kind: "recommendation" | "offer" | "contact" }) {
  if (kind === "contact") {
    return (
      <div
        className="brand-contact-scene"
        role="img"
        aria-label="Mesaj trimis în siguranță către RaportSolar"
      >
        <div className="brand-contact-scene__paper">
          <i />
          <i />
          <i />
        </div>
        <div className="brand-contact-scene__mark">✓</div>
      </div>
    );
  }
  return (
    <div
      className={`brand-journey-scene brand-journey-scene--${kind}`}
      role="img"
      aria-label={
        kind === "recommendation"
          ? "Datele casei devin o recomandare explicată"
          : "Oferta este verificată punct cu punct"
      }
    >
      <div className="brand-journey-scene__house">
        <span />
        <i />
        <i />
        <i />
      </div>
      <svg viewBox="0 0 260 80" aria-hidden="true">
        <path d="M8 42 C75 4 144 78 252 30" />
      </svg>
      <div className="brand-journey-scene__result">
        {kind === "recommendation" ? "5,4–6,2 kWp" : "Ce include oferta"}
      </div>
    </div>
  );
}
