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
    <main className="grid min-h-screen place-items-center bg-[#edf8e9] px-4">
      <div className="brand-surface brand-surface--light max-w-xl text-center">
        <img
          src="/brand/raportsolar-mark-512.png"
          width="72"
          height="72"
          alt=""
          className="mx-auto"
        />
        <p className="home-v2-eyebrow mt-5">Eroare 404</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.05em] text-foreground">
          Pagina nu a fost găsită
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Adresa nu există sau pagina a fost mutată.
        </p>
        <div className="mt-6">
          <Link to="/" className="brand-button brand-button--primary">
            Înapoi la pagina principală
          </Link>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <main className="grid min-h-screen place-items-center bg-[#fffdf8] px-4">
      <div className="brand-surface brand-surface--light max-w-xl text-center">
        <p className="home-v2-eyebrow">Problemă temporară</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-.04em] text-foreground">
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
            className="brand-button brand-button--primary"
          >
            Reîncearcă
          </button>
          <a href="/" className="brand-button brand-button--secondary">
            Pagina principală
          </a>
        </div>
      </div>
    </main>
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
      { property: "og:image", content: "https://raportsolar.ro/brand/raportsolar-og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://raportsolar.ro/brand/raportsolar-og.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/brand/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/brand/favicon-16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/brand/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
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
