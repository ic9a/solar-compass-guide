# Phase 2 performance profile

Profile date: 2026-07-30. Target: public editorial HTML on `https://raportsolar.ro`.

## Method and baseline

The production endpoint was sampled with HTTP timing and response-header checks before the Phase 2 deployment. A Chrome DevTools performance trace was not available in the connected environment, so no Lighthouse or Core Web Vitals laboratory score is asserted. Field Core Web Vitals must be read from Search Console only when Google reports sufficient data.

The relevant risk is server-rendered HTML latency rather than heavy editorial media: the shared pages contain text, existing CSS, and no new image, font, map, chart, or third-party script payload. Phase 2 therefore does not add a page-specific bundle or external runtime dependency.

## Safe change

The server now emits `Server-Timing: app;dur=<milliseconds>` for all responses. This exposes coarse application processing duration in browser tooling and repeatable HTTP probes without recording visitor data or changing cache behavior. Existing security and private-route noindex headers remain intact.

No broad HTML caching rule was added. Authenticated/private flows share the application server, and a cache change without a verified route-level Cloudflare cache key would risk serving the wrong representation. Any future edge-cache experiment must explicitly allow-list public GET/HEAD paths and verify cookies, status codes, redirects, and invalidation.

## Post-deploy checks

Sample the homepage and at least two Phase 2 routes from cold and warm requests; record status, TTFB, total time, content length, `Server-Timing`, cache status, canonical, and content type. Confirm no horizontal overflow at 390 px and no new console errors. Use Search Console Core Web Vitals as field evidence after sufficient traffic; do not label missing data as a pass.
