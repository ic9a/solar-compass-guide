# Final production-readiness notes

## First-party product analytics

Analytics are sent only to `POST /api/analytics` and written as structured
Cloudflare Worker logs. There is no third-party browser tracker.

| Event                           | Trigger                                         | Safe optional properties                 | Funnel interpretation     |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------- | ------------------------- |
| `homepage_view`                 | Homepage mounted                                | session, viewport, route                 | Funnel entry              |
| `upload_page_view`              | Upload route mounted                            | session, viewport, route                 | Upload intent             |
| `upload_file_selected`          | A locally valid file was selected               | session, viewport, route                 | Upload preparation        |
| `upload_started`                | Transfer initialization started                 | session, viewport, route                 | Upload started            |
| `upload_completed`              | Server verified and finalized the object        | session, outcome                         | Verified upload           |
| `upload_failed`                 | Initialization, transfer or finalization failed | session, failure category                | Recoverable drop-off      |
| `manual_entry_started`          | Manual form mounted                             | session, viewport, route                 | Manual-flow entry         |
| `recommendation_started`        | New or restored wizard mounted                  | session, viewport, route                 | Recommendation entry      |
| `recommendation_step_completed` | A validated step advanced                       | step                                     | Wizard progress           |
| `recommendation_completed`      | V2 produced a result                            | confidence, assumptions version, outcome | Recommendation completion |
| `solar_map_used`                | Solar-map route mounted                         | session, viewport, route                 | Map entry                 |
| `locality_selected`             | A search result was selected                    | session, viewport, route                 | Search success            |
| `example_report_viewed`         | Example report mounted                          | session, viewport, route                 | Report education          |
| `authentication_started`        | Authentication route mounted                    | session, viewport, route                 | Authentication entry      |
| `authentication_completed`      | A permanent session was observed                | session, outcome                         | Authentication completion |

The strict schema rejects extra fields. Filenames, document content, offer
values, access tokens, precise coordinates, locality names, email addresses,
private reports and raw recommendation answers are excluded.

Consent requirements for operational, first-party event logs remain a legal
question and are not asserted by this implementation.

## Structured observability

Server events contain only timestamp, environment, operation, status, route,
correlation ID, duration, safe category, provider/fallback flags and
assumptions version. A token-pattern guard blocks a complete event if its
serialized representation looks sensitive. Provider bodies, SQL errors,
signed URLs, storage paths, filenames and user identifiers are not logged.

The response `x-correlation-id` can be used to correlate a user-visible
failure with Cloudflare Worker logs.

## Database migration

`20260726110000_final_production_hardening.sql`:

- revokes `TRUNCATE`, `TRIGGER` and `REFERENCES` from browser-facing roles;
- creates an atomic, service-role-only rate-limit function;
- prevents `has_role` from probing another user's role;
- adds foreign-key indexes used by ownership and history paths.

The migration does not delete or rewrite production rows. Indexes can be
rolled back individually with `DROP INDEX CONCURRENTLY` if necessary. The
function can be replaced by its prior definition, and revoked privileges can
be re-granted, although doing so would reopen the documented security gaps.

## Known limitations and accepted findings

- Supabase anonymous sign-in remains enabled because anonymous ownership is a
  product requirement.
- `has_role` remains `SECURITY DEFINER` and executable by `authenticated`
  because RLS policies require it; it now returns true only for the caller.
- Supabase leaked-password protection must be enabled in the Auth dashboard;
  it is not controlled by a repository migration.
- Historical repository-wide formatting debt remains outside this phase.
- Browser Core Web Vitals must be measured from the deployed custom domain;
  bundle sizes alone are not presented as field CWV.
- Original documents are marked for cleanup and abandoned uploads are removed
  opportunistically after 24 hours. A scheduled retention job is still
  desirable for accounts that never return.
- Stripe product behavior is intentionally unchanged and excluded from this
  phase except for general secret/header review.
