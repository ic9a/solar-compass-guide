# Architecture and local development

RaportSolar is a Romanian TanStack Start application deployed as a Cloudflare Worker. Supabase provides authentication and protected persistence. The recommendation and energy validation logic is deterministic; external PVGIS data acquisition is isolated from frozen validation.

## Local setup

1. Install Node.js 22 and run `npm ci`.
2. Copy `.env.example` to an ignored local environment file.
3. Add only the values needed for the workflow being tested.
4. Run `npm run dev`.

Public UI and deterministic validation build without production secrets. Authenticated database flows, offer extraction and payment integrations fail closed when their server credentials are absent.

## Validation

- `npm run typecheck`
- `npm run lint:phase1`
- `npm run lint:phase2`
- `npm run lint:final`
- `npm test`
- `npm run build`
- `npm run public:verify`
- `npm run test:e2e`

The application provides decision support, not engineering certification, an installation design, a guaranteed energy yield, legal advice or financial advice.
