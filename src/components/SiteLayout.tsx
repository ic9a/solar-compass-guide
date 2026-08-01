import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main id="continut-principal" className="flex-1" data-site-content tabIndex={-1}>
        {children}
      </main>
      <div data-site-content>
        <SiteFooter />
      </div>
    </div>
  );
}
