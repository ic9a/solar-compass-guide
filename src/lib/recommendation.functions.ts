// Recommendation session persistence. The deterministic engine still lives
// in src/services/recommendationService.ts (kept versioned as calc v1);
// this server fn persists inputs + results per user.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { RecommendationSaveSchema } from "@/lib/schemas";

export const saveRecommendationSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RecommendationSaveSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Supabase's generated Json type does not accept Record<string, unknown>
    // directly; cast at the boundary.
    const row = {
      user_id: context.userId,
      inputs: data.inputs as never,
      monthly_consumption_kwh: (data.monthlyConsumptionKwh ?? null) as never,
      annual_consumption_kwh: data.annualConsumptionKwh ?? null,
      scenarios: (data.scenarios ?? null) as never,
      selected_scenario_id: data.selectedScenarioId ?? null,
      calculation_version: data.calculationVersion ?? 1,
      assumptions_version: data.assumptionsVersion ?? 1,
      status: data.status,
    };

    if (data.sessionId) {
      const { data: updated, error } = await context.supabase
        .from("recommendation_sessions")
        .update(row)
        .eq("id", data.sessionId)
        .eq("user_id", context.userId)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { sessionId: updated.id };
    }

    const { data: inserted, error } = await context.supabase
      .from("recommendation_sessions")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { sessionId: inserted.id };
  });

export const listMyRecommendationSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("recommendation_sessions")
      .select("id, status, annual_consumption_kwh, selected_scenario_id, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
