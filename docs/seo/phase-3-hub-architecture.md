# Phase 3 editorial hub architecture

## Taxonomy and source of truth

The existing `editorialPages` registry now holds summary, one controlled category, intended audience, estimated reading time, featured status and primary tool for all 18 pages. Category definitions, beginner path, featured selection, homepage selection and tool destinations are exported from the same module. Components never maintain a second guide inventory.

Reading times are conservative editorial estimates based on the visible article length and decision complexity. They are labels, not measured promises.

## Beginner journey

The six-step path follows the order in which missing information becomes actionable:

1. understand sizing;
2. convert power into module count;
3. separate production from savings;
4. compare battery choices;
5. evaluate payback with scenarios;
6. verify the installer offer.

Every step is a normal SSR link and remains usable without client JavaScript.

## Featured and homepage selection

The hub highlights four early high-value decisions: calculator inputs, panel count, production/economy and offer verification. The homepage shows only three guides: the calculator starting point, battery decision and offer verification. This connects discovery to the product purpose without displacing the existing upload and recommendation hierarchy.

## Related-guide behavior

Related targets remain explicit in the registry because editorial sequence is contextual. The renderer deterministically resolves, validates, de-duplicates by the stored list, excludes self and limits output to three. It shows title and concise summary and records a controlled discovery event.

## Tool destinations

Every registry item declares exactly one of `recommendation`, `solar_map` or `offer_analysis`. Shared metadata maps these identifiers to the existing entry routes and benefit-led CTA copy. No calculation or product-flow logic is duplicated.

## Navigation

`Ghiduri` links to the canonical hub from desktop navigation, the existing focus-trapped mobile navigation and the footer. TanStack Router active props provide the desktop active state. The fixed route reuses the existing canonical and indexability entry; no `/blog` route or sitemap list is introduced.

## Structured data

The hub emits a `CollectionPage`, an `ItemList` containing exactly the 18 visibly represented guides in registry order, and a two-level `BreadcrumbList`. It does not emit Article or FAQ schema because the hub's primary purpose is collection navigation. Supporting editorial pages retain Article, visible FAQ and BreadcrumbList graphs.

## Analytics and privacy

`editorial_guide_opened` records only an allow-listed guide slug, category, placement, source route, viewport and coarse session state. Existing `editorial_cta_clicked` remains the product-transition event. There is no static-visibility event and no category-selection event because the directory is static.

## Accessibility and performance

The hub uses semantic headings, ordered lists, normal links, visible focus rings, textual step numbers and labels that do not depend on color. All 18 entries are present in SSR HTML. The static categorized layout avoids inaccessible filter controls, query variants and client state. It adds no API request, Supabase query, external script, image payload or runtime dependency. Motion is limited to small hover transforms with reduced-motion overrides where introduced.


## Performance evidence

Before deployment, three production requests to the existing hub returned HTTP 200 with runner-observed TTFB of 6.67 s, 4.04 s and 3.54 s (total times 6.72 s, 4.08 s and 3.58 s). These samples include network and runner overhead and are not field Core Web Vitals. The Phase 3 implementation adds only synchronous local-registry rendering; the generated hub SSR route measured about 18.9 kB uncompressed / 4.6 kB gzip in CI and adds no runtime fetch, image or third-party dependency. Post-deploy measurements must use the same URL and distinguish HTTP timing from application `Server-Timing`.
