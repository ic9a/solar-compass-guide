# Google Search Console release runbook

Search Console is an operational measurement surface, not a release dependency.

## Setup

1. Add a Domain property for `raportsolar.ro` and verify it through the DNS record shown by Google.
2. Keep verification credentials out of the repository. DNS verification is preferred because it covers protocol and subdomain variants.
3. Submit `https://raportsolar.ro/sitemap.xml`.
4. Inspect the homepage, the guide hub and representative Phase 2 pages after deployment. Request indexing only after the live canonical, status, visible content and structured data have been checked.
5. Record the property owner, verification date and sitemap submission date in the private operations log. The repository must not claim verification or submission until a Search Console user confirms it.

## Phase 2 launch inspection set

Inspect these owners individually: `/calculator-panouri-fotovoltaice`, `/cate-panouri-fotovoltaice-imi-trebuie`, `/amortizare-sistem-fotovoltaic`, `/productie-si-economii-panouri-fotovoltaice`, `/sistem-fotovoltaic-cu-baterie-sau-fara`, and `/sistem-fotovoltaic-5-kw`. Verify rendered HTML, selected canonical, mobile usability, FAQ structured data and discovery in the submitted sitemap.

Use the demand map to group queries. If two pages begin ranking for the same query family, review intent and internal anchors before consolidating; do not create more variants to chase the same term.

## Weekly review for the first eight weeks

- Page indexing: newly discovered, crawled but not indexed, duplicate/canonical decisions and soft 404s.
- Sitemaps: fetch status and discovered URL count.
- Search results: impressions, clicks, CTR and average position by query and page.
- Core Web Vitals: field groups when enough data becomes available.
- Enhancements: structured-data errors and warnings.

Record annotations for deploy date, sitemap changes and major content revisions. Compare at least 28-day windows and avoid treating normal daily volatility as a release regression.

## Privacy-safe product events

`editorial_page_viewed` records only route, viewport and coarse session category through the existing allow-listed analytics schema. Do not send query text, locality, document names, email, offer details or free-form content. Search Console data should remain aggregated and access-controlled.

## Incident response

If a private URL appears in Search Console, verify its live `X-Robots-Tag`, remove any public internal link and confirm it is absent from the sitemap. Do not block it in robots before the crawler can observe `noindex`. For a wrong canonical, correct the registry and internal links, redeploy, inspect live HTML and then request recrawl.


## Honest readiness state

Code-level readiness means the sitemap, canonicals, index directives, structured data and inspection checklist are present and verified live. It does **not** mean the Domain property is verified, the sitemap is submitted, URLs are indexed, or enhancements are valid in Google. Those states require authenticated Search Console evidence and must be reported as pending until observed.


## Phase 3 editorial hub baseline

Repository and production checks must inspect:

- `https://raportsolar.ro/ghid-panouri-fotovoltaice`
- `https://raportsolar.ro/dimensionare-sistem-fotovoltaic` (Phase 1 representative)
- `https://raportsolar.ro/calculator-panouri-fotovoltaice` (Phase 2 representative)
- `https://raportsolar.ro/cum-verifici-o-oferta-fotovoltaica` (offer cluster)
- `https://raportsolar.ro/sitemap.xml`

| Metric | Baseline date | Value |
|---|---|---|
| Indexed pages | 2026-07-30 | Unavailable — authenticated Search Console required |
| Excluded pages | 2026-07-30 | Unavailable — authenticated Search Console required |
| Sitemap status | 2026-07-30 | Live HTTP readiness verified; Search Console submission status unavailable |
| Impressions | 2026-07-30 | Unavailable |
| Clicks | 2026-07-30 | Unavailable |
| CTR | 2026-07-30 | Unavailable |
| Average position | 2026-07-30 | Unavailable |
| Branded / non-branded queries | 2026-07-30 | Unavailable |
| Top landing pages | 2026-07-30 | Unavailable |

After authenticated access is available, annotate the hub release and compare hub discovery plus landing-page performance over at least 28 days. Do not create indexable category-query variants; the static hub remains the canonical collection.
