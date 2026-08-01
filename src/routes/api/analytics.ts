import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPayloadSchema } from "@/lib/analytics";
import { logEvent, safeCorrelationId } from "@/lib/observability.server";

const MAX_BODY_BYTES = 2_048;

export const Route = createFileRoute("/api/analytics")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const declaredLength = Number(request.headers.get("content-length") ?? 0);
        if (declaredLength > MAX_BODY_BYTES) return new Response(null, { status: 413 });

        try {
          const raw = await request.text();
          if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES)
            return new Response(null, { status: 413 });
          const parsed = AnalyticsPayloadSchema.safeParse(JSON.parse(raw));
          if (!parsed.success) return new Response(null, { status: 400 });

          const correlationId = safeCorrelationId(request.headers.get("cf-ray"));
          logEvent({
            operation: `analytics.${parsed.data.event}`,
            status: parsed.data.outcome === "failure" ? "failure" : "success",
            route: parsed.data.route,
            correlationId,
            category: parsed.data.failureCategory,
            assumptionsVersion: parsed.data.assumptionsVersion,
          });
          return new Response(null, {
            status: 204,
            headers: { "cache-control": "no-store" },
          });
        } catch {
          return new Response(null, { status: 400 });
        }
      },
    },
  },
});
