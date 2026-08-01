# Environment-variable matrix

Publishable Supabase values identify a project and client role; they are public by design. Service-role, AI, payment, webhook and deployment credentials are secrets.

| Variable | Purpose | Exposure | Secret | Local | GitHub Actions validation | Cloudflare production | Cloudflare preview or fork | Missing behavior |
|---|---|---|---|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Browser Supabase endpoint | browser | no | optional for build; needed for live auth | safe placeholder or absent | build-time public value | public value only | auth client remains unavailable |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser Supabase client role | browser | no | optional for build; needed for live auth | safe placeholder or absent | build-time public value | public value only | auth client remains unavailable |
| `VITE_SUPABASE_PROJECT_ID` | Browser project identifier | browser | no | optional | absent | optional public value | public value only | no functional server impact |
| `SUPABASE_URL` | Server Supabase endpoint | server | no | needed for live server flows | absent from validation | required public binding | no untrusted runtime preview | server data flows fail closed |
| `SUPABASE_PUBLISHABLE_KEY` | Server client-role calls | server | no | needed for live server flows | absent from validation | required public binding | no untrusted runtime preview | client-role calls fail |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server operations | server | yes | protected local file only | never | required protected secret | forbidden | privileged operations fail closed |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Offer extraction | server | yes | protected local file only | never | required protected secret | forbidden | extraction returns a controlled configuration error |
| `AI_MODEL` | Non-secret model selection | server | no | non-sensitive default allowed | non-sensitive default allowed | configured text variable | safe placeholder if a trusted preview exists | application default may apply |
| `STRIPE_SECRET_KEY` | Checkout/server payment calls | server | yes | protected local file only | never | protected secret | forbidden | payment operation fails closed |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | server | yes | protected local file only | never | protected secret | forbidden | webhook verification fails closed |
| `APP_ALLOWED_ORIGINS` | Trusted origins for sensitive operations | server | configuration-sensitive | protected local file if set | absent | production-only allow-list | preview origins must not be added implicitly | non-production origins are rejected |
| `CLOUDFLARE_API_TOKEN` | External deployment, if used | build system | yes | optional protected store | not used by validation | Workers Builds protected credential | forbidden to fork jobs | no external deployment |
| `CLOUDFLARE_ACCOUNT_ID` | Deployment account selector | build system | sensitive identifier | optional | not used | protected build configuration if required | forbidden to fork jobs | no external deployment |

The repository contains only variable names and browser-safe values. Local `.env*` and `.dev.vars*` files are ignored and excluded from export.
