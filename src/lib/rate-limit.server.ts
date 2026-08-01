// Simple per-user, per-endpoint, per-minute rate limiter backed by the
// `rate_limits` table. Uses service-role client to bypass RLS.
// Import inside server-function handlers only.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logEvent } from "@/lib/observability.server";

export async function rateLimitOrThrow(
  userId: string,
  endpoint: string,
  maxPerMinute: number,
) {
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    p_endpoint: endpoint,
    p_max_per_minute: maxPerMinute,
    p_user_id: userId,
  });

  if (error) {
    logEvent({
      operation: "rate_limit",
      status: "failure",
      category: "RATE_LIMIT_STORAGE_FAILED",
    });
    throw new Error("Serviciul este temporar indisponibil. Încearcă din nou.");
  }

  if (!data) {
    throw new Error("Prea multe cereri. Încearcă din nou peste un minut.");
  }
}
