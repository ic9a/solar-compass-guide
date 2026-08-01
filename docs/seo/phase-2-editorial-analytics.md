# Phase 2 editorial and analytics specification

## Editorial controls

The typed editorial registry is the single owner for slug, title, description, copy, FAQ, sources, related pages, and CTA. Phase 2 adds six substantial pages. Every page links to at least three relevant guides and to one existing product tool. The shared route emits one canonical, index/follow metadata, Article, BreadcrumbList and FAQPage JSON-LD.

Claims use conditional language and expose inputs. There are no fabricated volumes, fixed national production values, guaranteed savings, promised payback periods, installer endorsements, affiliate claims, or county doorway pages. Regulatory statements link to ANRE; solar resource methodology links to JRC PVGIS.

## CTA measurement

Allowed events:

- `editorial_page_viewed`: source route, viewport, coarse session category.
- `editorial_cta_clicked`: source route, destination tool enum and placement enum.
- `editorial_related_clicked`: source route and `related` placement.

Allowed destination values are `recommendation`, `solar_map`, and `offer_analysis`. Allowed placements are `hero`, `sidebar`, `inline`, and `related`. The Zod schema is strict: unknown properties are rejected.

Never transmit search terms, locality, consumption, uploaded filenames/content, offer data, email, user identifiers, free text, full URLs with query strings, or IP-derived fields. Analytics failure must never block navigation.

## Evaluation

Review by landing page and query family after enough Search Console data exists. Use impressions and position to judge discovery, CTR to review title/description fit, and privacy-safe CTA rate to judge usefulness. Do not optimize for clicks by adding unsupported numerical promises. Prefer 28-day comparisons with release annotations.
