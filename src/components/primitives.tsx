import type { ReactNode } from "react";

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  aside,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`page-hero ${className}`}>
      <div className="solar-orb solar-orb--one" />
      <div className="solar-orb solar-orb--two" />
      <div className={`page-hero__inner ${aside ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
        <div className="relative max-w-4xl">
          <div className="product-kicker">{eyebrow}</div>
          <h1 className="page-hero__title">{title}</h1>
          <p className="page-hero__description">{description}</p>
        </div>
        {aside && <div className="relative">{aside}</div>}
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`mb-10 md:mb-14 ${align === "center" ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}`}
    >
      {eyebrow && <div className="product-kicker mb-5">{eyebrow}</div>}
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.05em] text-foreground leading-[1.02]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base leading-7 md:text-lg md:leading-8 text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.75rem] border border-border/70 bg-card shadow-soft ${className}`}>
      {children}
    </div>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground italic">{children}</p>;
}
