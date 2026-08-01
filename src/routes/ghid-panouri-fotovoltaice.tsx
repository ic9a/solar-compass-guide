import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  ChevronRight,
  Compass,
  FileSearch,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { trackAnalytics } from "@/lib/analytics";
import {
  BEGINNER_PATH,
  EDITORIAL_CATEGORIES,
  FEATURED_GUIDE_SLUGS,
  SITE_URL,
  TOOL_DESTINATIONS,
  canonicalUrl,
  editorialBySlug,
  editorialPages,
  type EditorialCategory,
  type EditorialPage,
  type EditorialTool,
} from "@/lib/seo-content";

const HUB_SLUG = "ghid-panouri-fotovoltaice";
const HUB_URL = canonicalUrl(`/${HUB_SLUG}`);
const hub = editorialBySlug[HUB_SLUG];

export const Route = createFileRoute("/ghid-panouri-fotovoltaice")({
  head: () => ({
    meta: [
      { title: "Ghiduri panouri fotovoltaice pentru decizii informate | raportsolar.ro" },
      {
        name: "description",
        content:
          "Biblioteca RaportSolar: 18 ghiduri independente despre dimensionare, costuri, producție, baterii, echipamente, prosumatori și verificarea ofertelor.",
      },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { property: "og:title", content: "Ghiduri panouri fotovoltaice | raportsolar.ro" },
      { property: "og:description", content: hub.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: HUB_URL },
    ],
    links: [{ rel: "canonical", href: HUB_URL }],
  }),
  component: EditorialHub,
});

function trackGuide(
  page: EditorialPage,
  placement: "featured" | "beginner_path" | "category_directory" | "homepage" | "related_guides",
) {
  trackAnalytics("editorial_guide_opened", {
    session: "unknown",
    route: `/${HUB_SLUG}`,
    guideSlug: page.slug,
    editorialCategory: page.category,
    editorialPlacement: placement,
  });
}

function EditorialHub() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${HUB_URL}#collection`,
        url: HUB_URL,
        name: "Ghiduri panouri fotovoltaice",
        description: hub.description,
        inLanguage: "ro-RO",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": `${HUB_URL}#guides` },
      },
      {
        "@type": "ItemList",
        "@id": `${HUB_URL}#guides`,
        numberOfItems: editorialPages.length,
        itemListElement: editorialPages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: page.title,
          url: canonicalUrl(`/${page.slug}`),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Ghiduri", item: HUB_URL },
        ],
      },
    ],
  };

  useEffect(() => {
    trackAnalytics("editorial_page_viewed", { session: "unknown", route: `/${HUB_SLUG}` });
  }, []);

  return (
    <SiteLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <header id="hub-intro" className="relative overflow-hidden bg-[#f4f7f1]">
          <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-brand-sun/15 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-24 lg:px-8">
            <nav
              aria-label="Fir de navigare"
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <Link to="/">Acasă</Link>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <span aria-current="page">Ghiduri</span>
            </nav>
            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
              <div>
                <p className="product-kicker">
                  <BookOpen className="h-3.5 w-3.5" /> Biblioteca RaportSolar
                </p>
                <h1 className="mt-5 max-w-5xl text-4xl font-bold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                  Ghiduri pentru fiecare decizie despre sistemul fotovoltaic
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                  Înțelegi dimensionarea, producția, costurile, bateria, echipamentele și oferta
                  instalatorului. Poți urma traseul recomandat sau poți merge direct la întrebarea
                  care te preocupă acum. Estimările depind întotdeauna de consum, acoperiș,
                  localitate și configurația reală.
                </p>
                <nav aria-label="Subiecte ghiduri" className="mt-7 flex flex-wrap gap-2">
                  {EDITORIAL_CATEGORIES.map((category) => (
                    <a
                      key={category.id}
                      href={`#category-${category.id}`}
                      className="brand-button brand-button--secondary !min-h-10 !px-4 !py-2"
                    >
                      {category.label}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="rounded-[1.75rem] border border-brand-green/20 bg-white/85 p-6 shadow-soft">
                <ShieldCheck className="h-6 w-6 text-brand-green" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-bold">Documentare independentă</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  RaportSolar nu vinde panouri și nu primește comision pentru sistemul evaluat.
                  Ghidurile explică ipotezele și trimit la surse oficiale acolo unde informația se
                  poate schimba.
                </p>
              </div>
            </div>
          </div>
        </header>

        <BeginnerPath />
        <FeaturedGuides />
        <GuideDirectory />
        <ToolActions />
        <TrustMethod />
      </article>
    </SiteLayout>
  );
}

function BeginnerPath() {
  return (
    <section
      aria-labelledby="beginner-title"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
    >
      <div className="max-w-3xl">
        <p className="product-kicker">
          <Compass className="h-3.5 w-3.5" /> Traseu recomandat
        </p>
        <h2 id="beginner-title" className="mt-5 text-3xl font-bold tracking-[-0.045em] md:text-5xl">
          Începe de aici dacă încă îți construiești decizia
        </h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          Cele șase etape merg de la necesarul locuinței la verificarea ofertei. Fiecare pas poate
          fi parcurs separat.
        </p>
      </div>
      <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {BEGINNER_PATH.map((slug, index) => {
          const page = editorialBySlug[slug];
          return (
            <li
              key={slug}
              data-beginner-guide={slug}
              className="relative rounded-[1.6rem] border border-border bg-white p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#102a2b] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {page.readingMinutes} min
                </span>
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-[-0.025em]">{page.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{page.summary}</p>
              <Link
                to="/$slug"
                params={{ slug }}
                onClick={() => trackGuide(page, "beginner_path")}
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Continuă cu pasul {index + 1}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function FeaturedGuides() {
  return (
    <section
      aria-labelledby="featured-title"
      className="bg-[#102a2b] px-4 py-16 text-white sm:px-6 md:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-sun">
          Decizii esențiale
        </p>
        <h2 id="featured-title" className="mt-4 text-3xl font-bold tracking-[-0.045em] md:text-5xl">
          Ghiduri utile înainte să ceri sau să semnezi o ofertă
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {FEATURED_GUIDE_SLUGS.map((slug, index) => {
            const page = editorialBySlug[slug];
            return (
              <Link
                key={slug}
                data-featured-guide={slug}
                to="/$slug"
                params={{ slug }}
                onClick={() => trackGuide(page, "featured")}
                className={`group rounded-[1.8rem] border p-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sun ${index === 0 ? "border-brand-sun/45 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/8"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.13em] text-brand-sun">
                    {EDITORIAL_CATEGORIES.find((category) => category.id === page.category)?.label}
                  </span>
                  <ArrowRight
                    className="h-5 w-5 text-white/50 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-8 text-2xl font-bold tracking-[-0.035em]">{page.title}</h3>
                <p className="mt-3 max-w-2xl leading-7 text-white/65">{page.summary}</p>
                <p className="mt-6 text-xs font-semibold text-white/50">
                  {page.readingMinutes} minute · {page.audience}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GuideDirectory() {
  return (
    <section
      aria-labelledby="directory-title"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
    >
      <div className="max-w-3xl">
        <p className="product-kicker">
          <BookOpen className="h-3.5 w-3.5" /> Toate ghidurile
        </p>
        <h2
          id="directory-title"
          className="mt-5 text-3xl font-bold tracking-[-0.045em] md:text-5xl"
        >
          Alege întrebarea la care ai nevoie de un răspuns
        </h2>
      </div>
      <div className="mt-12 space-y-14">
        {EDITORIAL_CATEGORIES.map((category) => {
          const pages = editorialPages.filter((page) => page.category === category.id);
          if (pages.length === 0) return null;
          return (
            <section key={category.id} aria-labelledby={`category-${category.id}`}>
              <div className="grid gap-3 md:grid-cols-[16rem_minmax(0,1fr)] md:items-end">
                <h3 id={`category-${category.id}`} className="text-2xl font-bold">
                  {category.label}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">{category.description}</p>
              </div>
              <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pages.map((page) => (
                  <li key={page.slug} data-guide-directory-slug={page.slug} className="min-w-0">
                    {page.slug === HUB_SLUG ? (
                      <a
                        href="#hub-intro"
                        className="group flex h-full min-h-52 flex-col rounded-[1.5rem] border border-brand-green/25 bg-brand-green-soft/25 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <GuideCardContent page={page} current />
                      </a>
                    ) : (
                      <Link
                        to="/$slug"
                        params={{ slug: page.slug }}
                        onClick={() => trackGuide(page, "category_directory")}
                        className="group flex h-full min-h-52 flex-col rounded-[1.5rem] border border-border bg-white p-6 transition-shadow hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <GuideCardContent page={page} />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function GuideCardContent({ page, current = false }: { page: EditorialPage; current?: boolean }) {
  const category = EDITORIAL_CATEGORIES.find((item) => item.id === page.category);
  return (
    <>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="text-primary">{category?.label}</span>
        <span className="text-muted-foreground">{page.readingMinutes} min</span>
      </div>
      <h4 className="mt-5 text-xl font-bold tracking-[-0.025em]">{page.title}</h4>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{page.summary}</p>
      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-foreground">
        {current ? "Revino la introducere" : "Citește ghidul"}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </>
  );
}

const toolIcons = {
  recommendation: Calculator,
  solar_map: MapPinned,
  offer_analysis: FileSearch,
} as const;

function ToolActions() {
  const tools: EditorialTool[] = ["recommendation", "solar_map", "offer_analysis"];
  return (
    <section
      aria-labelledby="tools-title"
      className="bg-[#f4f7f1] px-4 py-16 sm:px-6 md:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <h2 id="tools-title" className="text-3xl font-bold tracking-[-0.045em] md:text-5xl">
          Când ești pregătit, treci de la documentare la cazul tău
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {tools.map((tool) => {
            const item = TOOL_DESTINATIONS[tool];
            const Icon = toolIcons[tool];
            return (
              <Link
                key={tool}
                to={item.destination}
                className="group rounded-[1.7rem] bg-white p-7 shadow-soft"
              >
                <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                <h3 className="mt-8 text-xl font-bold">{item.label}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Deschide instrumentul
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrustMethod() {
  return (
    <section
      aria-labelledby="method-title"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="rounded-[2rem] border border-border bg-white p-7 md:p-10">
        <h2 id="method-title" className="text-2xl font-bold">
          Cum folosim sursele și estimările
        </h2>
        <p className="mt-4 max-w-4xl leading-7 text-muted-foreground">
          Datele solare sunt raportate la surse precum JRC/PVGIS, iar procedurile administrative
          trimit la instituțiile competente. Nicio simulare nu înlocuiește măsurarea acoperișului,
          proiectarea electrică sau verificarea contractului. Fiecare ghid indică sursele relevante
          și explică unde rezultatul rămâne dependent de situația reală.
        </p>
      </div>
    </section>
  );
}
