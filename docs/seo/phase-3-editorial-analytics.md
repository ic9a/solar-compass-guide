# Phase 3 editorial analytics

## Event taxonomy

| Event | Trigger | Allowed controlled properties |
|---|---|---|
| `editorial_page_viewed` | An editorial page or hub loads in the browser | source `route`, viewport, coarse session |
| `editorial_guide_opened` | A user opens a guide from the hub, homepage or related section | `guideSlug`, `editorialCategory`, `editorialPlacement`, source `route`, viewport, coarse session |
| `editorial_cta_clicked` | A user follows the primary editorial-to-product action | `destinationTool`, `ctaPlacement`, source `route`, viewport, coarse session |
| `editorial_related_clicked` | Legacy Phase 1 related-link event retained for compatibility | source `route`, `related` placement |

Allowed placement values for guide discovery are `featured`, `beginner_path`, `category_directory`, `homepage`, and `related_guides`. Categories and slugs are complete Zod enums matching the registry. Product destinations remain `recommendation`, `solar_map`, and `offer_analysis`.

Example:

```json
{
  "event": "editorial_guide_opened",
  "route": "/ghid-panouri-fotovoltaice",
  "viewport": "mobile",
  "session": "unknown",
  "guideSlug": "dimensionare-sistem-fotovoltaic",
  "editorialCategory": "dimensionare",
  "editorialPlacement": "beginner_path"
}
```

The strict schema rejects unknown fields. Never send locality or address text, coordinates, consumption, names, emails, account/analysis/offer/report identifiers, filenames, document content, free-form text or full URLs with identifiers. These dimensions measure navigation choices, not household or personal characteristics.
