import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChevronRight, ExternalLink, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import {
  SEO_LAST_MODIFIED,
  canonicalUrl,
  TOOL_DESTINATIONS,
  editorialBySlug,
  relatedEditorialPages,
  type EditorialPage,
} from "@/lib/seo-content";
import { trackAnalytics } from "@/lib/analytics";

export const Route = createFileRoute("/$slug")({
  loader: ({ params }) => {
    const page = editorialBySlug[params.slug];
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    const page = loaderData as EditorialPage;
    const url = canonicalUrl(`/${page.slug}`);
    return {
      meta: [
        { title: `${page.title} | raportsolar.ro` },
        { name: "description", content: page.description },
        { name: "robots", content: "index,follow,max-image-preview:large" },
        { property: "og:title", content: page.title },
        { property: "og:description", content: page.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: page.title },
        { name: "twitter:description", content: page.description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: EditorialRoute,
});

function EditorialRoute() {
  const page = Route.useLoaderData();
  const url = canonicalUrl(`/${page.slug}`);
  const toolCta = TOOL_DESTINATIONS[page.primaryTool];
  const primaryCta = page.primaryCta ?? {
    label: toolCta.label,
    destination: toolCta.destination,
    tool: page.primaryTool,
  };
  const relatedPages = relatedEditorialPages(page);
  const sectionId = (heading: string) =>
    `${page.slug}-${heading
      .toLocaleLowerCase("ro-RO")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: page.title,
        description: page.description,
        dateModified: SEO_LAST_MODIFIED,
        inLanguage: "ro-RO",
        mainEntityOfPage: url,
        author: { "@id": "https://raportsolar.ro/#organization" },
        publisher: { "@id": "https://raportsolar.ro/#organization" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: "https://raportsolar.ro/" },
          {
            "@type": "ListItem",
            position: 2,
            name: "Ghiduri",
            item: "https://raportsolar.ro/ghid-panouri-fotovoltaice",
          },
          { "@type": "ListItem", position: 3, name: page.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  useEffect(() => {
    trackAnalytics("editorial_page_viewed", { session: "unknown", route: `/${page.slug}` });
  }, [page.slug]);

  return (
    <SiteLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <header className="article-hero">
          <div className="brand-shell article-hero__inner">
            <div>
              <nav
                aria-label="Fir de navigare"
                className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
              >
                <Link to="/">Acasă</Link>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <Link to="/$slug" params={{ slug: "ghid-panouri-fotovoltaice" }}>
                  Ghiduri
                </Link>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <span aria-current="page">{page.eyebrow}</span>
              </nav>
              <p className="product-kicker mt-6">{page.eyebrow}</p>
              <h1>{page.title}</h1>
              <p className="article-hero__intro">{page.intro}</p>
              <p className="mt-5 text-xs text-muted-foreground">
                Revizuit la {SEO_LAST_MODIFIED}. Conținut educațional independent.
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8">
          <div className="article-content space-y-12">
            {page.sections.map((section) => (
              <section key={section.heading} aria-labelledby={sectionId(section.heading)}>
                <h2 id={sectionId(section.heading)}>{section.heading}</h2>
                <div className="mt-4 space-y-4 text-base leading-8 text-foreground/80">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets && (
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {section.bullets.map((item) => (
                      <li key={item} className="rounded-xl border border-border bg-card p-4">
                        ✓ {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <section aria-labelledby="intrebari">
              <h2 id="intrebari" className="text-2xl font-bold tracking-tight">
                Întrebări frecvente
              </h2>
              <dl className="mt-5 space-y-4">
                {page.faq.map((item) => (
                  <div key={item.question} className="rounded-2xl border border-border bg-card p-5">
                    <dt className="font-semibold">{item.question}</dt>
                    <dd className="mt-2 leading-7 text-muted-foreground">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="surse">
              <h2 id="surse" className="text-xl font-bold">
                Surse și verificare
              </h2>
              <ul className="mt-4 space-y-2">
                {page.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
                      href={source.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {source.label}
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <nav className="article-toc" aria-label="Cuprinsul ghidului">
              <p className="home-v2-eyebrow">În acest ghid</p>
              <ol>
                {page.sections.map((section) => (
                  <li key={section.heading}>
                    <a href={`#${sectionId(section.heading)}`}>{section.heading}</a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="rounded-2xl border border-primary/20 bg-brand-green-soft/40 p-5">
              <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-3 font-bold">Independență editorială</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                RaportSolar nu vinde panouri și nu primește comision pentru sistemul evaluat.
                Analiza este orientativă și nu înlocuiește proiectarea, consultanța juridică sau
                financiară.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-bold">Următorul ghid util</h2>
              <ul className="mt-3 space-y-3">
                {relatedPages.map((related) => (
                  <li key={related.slug}>
                    <Link
                      className="group block rounded-xl p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      to="/$slug"
                      params={{ slug: related.slug }}
                      onClick={() =>
                        trackAnalytics("editorial_guide_opened", {
                          session: "unknown",
                          route: `/${page.slug}`,
                          guideSlug: related.slug,
                          editorialCategory: related.category,
                          editorialPlacement: "related_guides",
                        })
                      }
                    >
                      <span className="text-sm font-semibold text-primary group-hover:underline">
                        {related.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {related.summary}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Pas practic
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{toolCta.description}</p>
            </div>
            <Link
              to={primaryCta.destination}
              onClick={() =>
                trackAnalytics("editorial_cta_clicked", {
                  session: "unknown",
                  route: `/${page.slug}`,
                  destinationTool: primaryCta.tool,
                  ctaPlacement: "sidebar",
                })
              }
              className="inline-flex w-full justify-center rounded-full bg-gradient-brand px-5 py-3 text-center text-sm font-semibold text-white"
            >
              {primaryCta.label}
            </Link>
          </aside>
        </div>
      </article>
    </SiteLayout>
  );
}
