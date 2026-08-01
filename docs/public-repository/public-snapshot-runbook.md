# Public snapshot runbook

This process prepares a clean source snapshot for the public source-available repository. It does not copy Git history.

## Verify the tracked tree

```sh
npm ci
npm run public:verify
```

The verifier checks tracked paths, identity-like email values, known secret forms, unsafe environment values and private-only directories. Findings contain only category and path.

Gitleaks is the independent recognized secret scanner in CI.

## Export

```sh
npm run public:export -- .public-snapshot
```

The exporter copies allowed files returned by `git ls-files`; it never copies `.git` or history. It rejects symbolic links and excludes environment files, Wrangler state, build/test artifacts, uploads, private datasets and operational notes.

## Clean-room release check

Inside the exported directory run:

```sh
npm ci
npm run public:verify
npm run typecheck
npm run lint:phase1
npm run lint:phase2
npm run lint:final
npm test
npm run build
node scripts/validate-real-world-calibration.mjs
npx playwright install --with-deps chromium
npx playwright test tests/e2e/public-snapshot-smoke.spec.ts --project=desktop-1280
```

CI performs these commands without production secrets. The exporter writes `PUBLICATION-MANIFEST.json` with the source commit, UTC generation time, command, file count, redacted validation summary, and an explicit no-history statement. Initialize the public repository from this directory with one new root commit. The approved licensing model is the root source-available `LICENSE`; non-production Cloudflare builds must remain disabled.
