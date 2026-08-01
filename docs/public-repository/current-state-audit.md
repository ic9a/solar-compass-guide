# Current-state audit

Audit date: 2026-08-01.

## Baseline

- Private repository: `ic9a/solar-compass-guide`.
- Default branch: `main`.
- Audited main and production baseline: `5f73f467acac9050f58658d63395db315939c44f`.
- The baseline contains the SEO Phase 3 merge and no later unfinished commit.
- Production Worker: `raportsolar-app`.
- Production origin: `https://raportsolar.ro`.
- Repository visibility remains private. This phase neither changes visibility nor creates another repository.

## Tracked environment and infrastructure

- `.env.example` contains names and empty or non-sensitive example values.
- `.gitignore` excludes local environment files, Wrangler state, build output and test artifacts.
- `wrangler.jsonc` defines the Worker build, public Supabase bindings and required server-only secret names.
- `.github/workflows/ci.yml` owns static validation.
- `.github/workflows/phase-1-quality.yml` owns energy, full browser and clean-room validation.
- `.github/workflows/real-world-calibration-validation.yml` validates frozen evidence when it changes.

No GitHub Actions workflow deploys or receives production credentials. Production deploys are performed by Cloudflare Workers Builds from trusted `main`. Repository history shows that branch previews previously existed; this branch disables Worker preview URLs and the operational runbook requires non-production branch builds to be disabled before a public fork workflow is enabled.

## Supabase authentication and roles

Authentication profiles and default roles are created by `public.handle_new_user()`. Authorization is stored in `public.user_roles`. A historical migration contained identity-based administrator bootstrapping; the tracked migration is sanitized and a forward-only corrective migration replaces the live function without deleting existing role assignments.

Migrations that affect authentication, ownership and roles remain in the private repository history. Public documentation records behavior, never identities.

## Fixtures

Frozen energy-model fixtures are official PVGIS-derived validation inputs. Real-world derived fixtures are registered in `validation/real-world-data/sources.json`; accepted outputs use documented redistribution licences. Rejected or unresolved sources have no committed output.

## Clean public snapshot boundary

The future snapshot is an export of the final tracked tree, not a clone. It contains no `.git`, commits, PR metadata, local environment files, Wrangler state, uploads, build output, private-only datasets or operational notes. `npm run public:verify` and `npm run public:export` enforce this boundary.

The following remain private:

- all existing Git history and historical Actions logs;
- the formerly committed environment file and its old values;
- pull requests, issues and internal operational history;
- production secret stores and deployment credentials;
- user, offer, upload, payment and report data;
- private-only or unresolved-rights datasets.
