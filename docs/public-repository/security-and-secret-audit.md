# Security, secret and personal-data audit

Audit date: 2026-08-01. This report intentionally contains categories and paths only.

## Method

The tracked tree, generated/export exclusions, workflows, migrations, documentation, fixtures, public assets and clean snapshot are checked by:

1. deterministic path and pattern verification in `scripts/public-snapshot.mjs`;
2. deterministic Vitest invariants in `tests/public-readiness.test.ts`;
3. Gitleaks, pinned to an immutable Action commit, on each pull request;
4. clean-room export, install, build, test and representative browser execution.

Scanner errors print only a category and repository-relative path. Matched values are never printed.

## Current tracked-tree result

The readiness branch removes the historical personal administrator identity and contains no tracked service-role key, Supabase JWT secret, Stripe secret, webhook secret, Gemini key, Cloudflare token, database password, private key, bearer token, GitHub token, raw customer document or uploaded PDF.

Supabase publishable credentials and project URL are browser-visible identifiers by design. They are not authorization secrets; Row Level Security and server-side authorization remain mandatory.

## Historical environment inventory

The historical environment file contained only Supabase URL, project identifier and publishable-key categories, including their browser-prefixed equivalents. No service-role, Stripe, Gemini, Cloudflare, database or webhook secret category was present in that file.

Classification:

| Category | Status |
|---|---|
| Supabase URL and project identifier | confirmed non-secret; current browser use is intentional |
| Supabase publishable key | confirmed non-secret; current value is publishable by design |
| Service-role, JWT, payment, AI, deployment and database secrets | not present in the inspected historical environment file |
| Production server secrets used today | current value stored only in protected provider secret stores |

The private history is not rewritten. It must never be copied into the future public repository.

## Data and document boundary

No customer offer, uploaded document, user record, address, household profile or administrative identity belongs in the snapshot. Future fixtures must be aggregated or synthetic, licensed, registered and covered by deterministic validation.
