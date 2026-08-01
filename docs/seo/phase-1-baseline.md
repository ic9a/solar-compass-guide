# SEO Phase 1 baseline

Date: 2026-07-30  
Repository baseline: `b9d4762d4f6eb217f4926dbfd725c85e49b36927`  
Production: `https://raportsolar.ro`

## Executive findings

The application returns server-rendered HTML with meaningful public content. The current sitemap contains 12 URLs, but it mixes conversion workflows, informational pages and legal pages without a shared indexability registry. `robots.txt` blocks result/account/admin prefixes, yet sampled private and invalid result URLs still return `200` HTML. A robots disallow is not a substitute for `noindex`, because a blocked URL can remain known to a search engine.

No canonical link was found in the sampled initial HTML. The root supplies Organization and WebSite structured data, while public informational routes do not consistently publish Article, BreadcrumbList or FAQPage data. Existing public titles and descriptions are rendered in the initial response.

## Sampled production evidence

| Path | Status | Initial HTML | Baseline decision |
|---|---:|---|---|
| `/` | 200 | SSR | index |
| `/recomandare-sistem` | 200 | SSR | index |
| `/harta-solara-romania` | 200 | SSR | index |
| `/cum-functioneaza` | 200 | SSR | index |
| `/intrebari-frecvente` | 200 | SSR | index |
| `/autentificare` | 200 | SSR | noindex |
| `/cont` | 200 | SSR | noindex |
| `/rezultat-gratuit/test` | 200 | SSR | noindex |
| `/raport-complet/test` | 307 → 200 | SSR after redirect | noindex |
| `/robots.txt` | 200 | text/plain | utility |
| `/sitemap.xml` | 200 | XML | utility |

## Phase 1 architecture

- `src/lib/seo-content.ts` is the canonical registry for editorial pages, canonical URLs, sitemap membership and private prefixes.
- `src/routes/$slug.tsx` renders the 12 one-segment cornerstone routes from typed content.
- Public editorial pages emit unique metadata, canonical links, Article, BreadcrumbList and FAQPage JSON-LD.
- `src/server.ts` emits `X-Robots-Tag: noindex, nofollow, noarchive` for private, account, analysis, result and API prefixes even when a route returns `200`.
- The sitemap is generated only from the explicit indexable registry and includes `lastmod`.
- Tests reject duplicate slugs, thin pages, missing sources/FAQs/internal links and private paths admitted into the sitemap registry.

## Information architecture

The hub is `/ghid-panouri-fotovoltaice`. Supporting clusters cover sizing, production, costs, storage, inverters, prosumer process, offer verification, autoconsumption, financing, maintenance and warranties. Each page links to at least three adjacent guides and to the system recommendation workflow.

The location expansion remains a template decision only. No county pages are generated in Phase 1. A future location page must require unique measured/sourced local content, a stable canonical, sufficient demand, and editorial review; otherwise it must not be published or added to the sitemap.

## Content and independence policy

The copy is Romanian, educational and explicit about uncertainty. Current procedures link to official sources and tell readers to verify the version in force. RaportSolar states that it does not sell panels or receive a commission for the evaluated installation. Technical analysis is not represented as engineering, legal or financial advice.

## Known limits

- Search engines control crawling, indexing and rankings; release does not guarantee any outcome.
- Search Console access is not required for deployment. Submission and measurement steps are documented separately.
- Field Core Web Vitals need real-user data after sufficient traffic; laboratory checks are release diagnostics, not field guarantees.
