# Cloudflare public-preview security

## Audited behavior

Production is deployed by Cloudflare Workers Builds from the trusted `main` branch. GitHub Actions performs validation only and contains no Cloudflare deployment credential or deploy command.

Repository history records same-repository branch previews. Cloudflare Workers preview versions otherwise reuse a Worker's runtime bindings, so untrusted code must not receive an executable preview with production secrets.

## Enforced repository controls

- `wrangler.jsonc` sets `preview_urls` to `false`.
- Required server secret names are declared, but values remain in Cloudflare's protected store.
- No fork pull-request workflow calls Wrangler or receives deployment credentials.
- `APP_ALLOWED_ORIGINS` is production-only; preview origins are not automatically trusted.
- Validation builds require no production secret.
- The public snapshot excludes local Wrangler and environment state.

## Cloudflare dashboard requirement

Before the future public repository is connected, Workers Builds branch control must keep production at `main` and disable builds for non-production branches. Trusted branch validation stays in GitHub Actions. If trusted previews are reintroduced later, they require a separate Worker/environment, separate Supabase project or non-mutating credentials, separate variables and an origin policy that cannot reach production operations.

Preview safety is blocked if the dashboard enables non-production branch builds for untrusted source or if a preview can execute with production runtime secrets. The release checklist must verify this provider-side setting; repository configuration alone cannot prove a dashboard toggle.
