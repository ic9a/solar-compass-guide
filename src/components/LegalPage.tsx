import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MarketingPageHero } from "./brand-system";

const links = [
  ["/legal/confidentialitate", "Confidențialitate"],
  ["/legal/cookies", "Cookies"],
  ["/legal/termeni", "Termeni și condiții"],
] as const;

export function LegalPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <MarketingPageHero eyebrow={eyebrow} title={title} description={description} />
      <div className="brand-section brand-section--paper">
        <div className="brand-shell legal-shell">
          <nav className="legal-nav" aria-label="Documente legale">
            <p className="home-v2-eyebrow">Documente</p>
            {links.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </nav>
          <article className="legal-document prose prose-slate max-w-none">{children}</article>
        </div>
      </div>
    </>
  );
}
