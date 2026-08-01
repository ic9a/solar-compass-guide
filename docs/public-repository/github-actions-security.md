# GitHub Actions security

## Trust model

Pull-request validation runs untrusted source with a read-only token and no repository or deployment secrets. Production deployment is outside Actions and occurs only through the trusted Cloudflare `main` integration.

## Controls

- workflow-level `contents: read`;
- no `pull_request_target`;
- no deployment jobs or deployment credentials;
- checkout credentials are not persisted;
- every third-party Action is pinned to a full commit SHA with a version comment;
- explicit timeouts and bounded artifact retention;
- no shell interpolation of PR titles, bodies, branch names or other untrusted metadata;
- superseded pull-request commits are cancelled by PR-scoped concurrency;
- main runs are not cancelled;
- Gitleaks and deterministic redacted scanning;
- validation uses no production Supabase, Gemini, Stripe or Cloudflare secret.

## Coverage and efficiency

`CI` owns dependency installation, typecheck, all three lint suites, unit/invariant tests, Worker production build, public verification and secret scanning. The quality workflow no longer repeats that static job.

`Production readiness quality` retains deterministic energy validation, the complete Chromium mobile and desktop matrices, Firefox, WebKit, final browser gate and a clean-room snapshot job. No browser, viewport, product test or scientific benchmark was removed.
