import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthSessionProvider } from "@/lib/auth/AuthSessionProvider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Pagina nu a fost găsită</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Adresa nu există sau pagina a fost mutată.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Înapoi la pagina principală
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Pagina nu s-a încărcat
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A apărut o problemă temporară. Poți încerca din nou fără să pierzi datele deja salvate.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reîncearcă
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Pagina principală
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "raportsolar.ro — verificare oferte panouri fotovoltaice" },
      { name: "author", content: "raportsolar.ro" },
      { property: "og:site_name", content: "raportsolar.ro" },
      { property: "og:title", content: "raportsolar.ro — verificare oferte panouri fotovoltaice" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ro_RO" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "raportsolar.ro — verificare oferte panouri fotovoltaice" },
      {
        name: "description",
        content:
          "Află ce sistem fotovoltaic ți se potrivește și verifică orice ofertă înainte să semnezi. Recomandări orientative, analiză ofertă și harta solară a României.",
      },
      {
        property: "og:description",
        content:
          "Află ce sistem fotovoltaic ți se potrivește și verifică orice ofertă înainte să semnezi. Recomandări orientative, analiză ofertă și harta solară a României.",
      },
      {
        name: "twitter:description",
        content:
          "Află ce sistem fotovoltaic ți se potrivește și verifică orice ofertă înainte să semnezi. Recomandări orientative, analiză ofertă și harta solară a României.",
      },
      { property: "og:image", content: "https://raportsolar.ro/favicon.svg" },
      { name: "twitter:image", content: "https://raportsolar.ro/favicon.svg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=2" },
      { rel: "apple-touch-icon", href: "/favicon.svg?v=2" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://raportsolar.ro/#organization",
        name: "raportsolar.ro",
        url: "https://raportsolar.ro/",
      },
      {
        "@type": "WebSite",
        "@id": "https://raportsolar.ro/#website",
        url: "https://raportsolar.ro/",
        name: "raportsolar.ro",
        inLanguage: "ro-RO",
        publisher: { "@id": "https://raportsolar.ro/#organization" },
      },
    ],
  };
  return (
    <html lang="ro">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <a
          href="#continut-principal"
          className="sr-only z-[200] rounded-md bg-white px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Sari la conținut
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
