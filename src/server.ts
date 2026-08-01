import { renderErrorPage } from "./lib/error-page";
import { logEvent, safeCorrelationId, safeErrorCategory } from "./lib/observability.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

function exposeBindingsToNodeEnvironment(env: unknown): void {
  if (!env || typeof env !== "object") return;

  // Cloudflare passes runtime variables and secrets through the fetch `env`
  // argument. The application uses Node-compatible libraries that read
  // `process.env`, so copy only string bindings before importing the server
  // entry. Object bindings such as ASSETS are intentionally ignored.
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  logEvent({
    operation: "ssr.render",
    status: "failure",
    category: "SSR_HTTP_ERROR",
  });
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://tile.openstreetmap.org",
  "worker-src 'self' blob:",
].join("; ");

const NOINDEX_PREFIXES = [
  "/admin",
  "/analiza",
  "/api",
  "/autentificare",
  "/cont",
  "/corectare",
  "/raport-complet",
  "/rezultat-gratuit",
] as const;

function isPrivatePath(pathname: string): boolean {
  return NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function withProductionHeaders(
  response: Response,
  correlationId: string,
  pathname = "/",
  durationMs = 0,
): Response {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("x-frame-options", "DENY");
  headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  headers.set("content-security-policy-report-only", CSP_REPORT_ONLY);
  headers.set("x-correlation-id", correlationId);
  headers.set("server-timing", `app;dur=${Math.max(0, durationMs)}`);
  if (isPrivatePath(pathname)) {
    headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const startedAt = Date.now();
    const correlationId = safeCorrelationId(request.headers.get("cf-ray"));
    try {
      exposeBindingsToNodeEnvironment(env);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      if (normalized.status >= 500) {
        logEvent({
          operation: "http.request",
          route: new URL(request.url).pathname,
          correlationId,
          status: "failure",
          category: "HTTP_5XX",
          durationMs: Date.now() - startedAt,
        });
      }
      return withProductionHeaders(
        normalized,
        correlationId,
        new URL(request.url).pathname,
        Date.now() - startedAt,
      );
    } catch (error) {
      logEvent({
        operation: "http.request",
        route: new URL(request.url).pathname,
        correlationId,
        status: "failure",
        category: safeErrorCategory(error, "UNHANDLED_SERVER_ERROR"),
        durationMs: Date.now() - startedAt,
      });
      return withProductionHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        correlationId,
        new URL(request.url).pathname,
        Date.now() - startedAt,
      );
    }
  },
};
