// Ownership transfer helpers used when an anonymous session ends up with a
// different auth.users.id than the newly-signed-in permanent account
// (e.g. an OAuth fallback mints a new user instead of linking).
//
// Flow:
//   1. Client, while STILL anonymous, captures the anon access token.
//   2. Client signs in / signs up (Google, email, magic link).
//   3. If the new session's user id differs from the anon user id, client
//      calls claimAnonymousOwnership with the old anon token.
//   4. Server validates the old token via the Supabase auth API, confirms the
//      old user is still marked anonymous, then calls the DB function
//      public.transfer_ownership() (SECURITY DEFINER) to move all data.
//
// Safety:
//   - The old token proves the caller controlled the anonymous session.
//   - The DB function refuses to move data away from a non-anonymous user.
//   - A row is written to public.ownership_transfers for audit.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { getRequestIP } from "@tanstack/react-start/server";
import { logEvent } from "@/lib/observability.server";

const InputSchema = z.object({
  anonymousAccessToken: z.string().min(20).max(4000),
});

export const claimAnonymousOwnership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const destUserId = context.userId;

    // 1. Resolve the anonymous user id from the passed token by asking Auth.
    const url = process.env.SUPABASE_URL!;
    const publishable = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const anonClient = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (publishable.startsWith("sb_") && h.get("Authorization") === `Bearer ${publishable}`) {
            h.delete("Authorization");
          }
          h.set("apikey", publishable);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: userRes, error: userErr } = await anonClient.auth.getUser(
      data.anonymousAccessToken,
    );
    if (userErr || !userRes.user) {
      throw new Error("Sesiunea anonimă nu a putut fi verificată.");
    }
    const sourceUserId = userRes.user.id;

    // The token must belong to an anonymous user, not another permanent user.
    // (auth.getUser returns is_anonymous on the user object.)
    const isAnon = (userRes.user as { is_anonymous?: boolean }).is_anonymous ?? false;
    if (!isAnon) {
      throw new Error("Token-ul furnizat nu aparține unui vizitator anonim.");
    }

    if (sourceUserId === destUserId) {
      return { ok: true, noop: true };
    }

    // 2. Call the SECURITY DEFINER transfer function (service role required).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc("transfer_ownership", {
      source_user_id: sourceUserId,
      dest_user_id: destUserId,
    });
    if (rpcErr) {
      logEvent({
        operation: "account.transfer_ownership",
        status: "failure",
        category: "OWNERSHIP_TRANSFER_FAILED",
      });
      // Best-effort audit of the failure.
      let ip: string | null = null;
      try {
        ip = getRequestIP({ xForwardedFor: true }) ?? null;
      } catch {
        /* not in request scope */
      }
      await supabaseAdmin.from("ownership_transfers").insert({
        from_user_id: sourceUserId,
        to_user_id: destUserId,
        status: "failed",
        reason: rpcErr.message,
        ip_address: ip,
      });
      throw new Error("Transferul datelor a eșuat. Contactează-ne dacă datele lipsesc.");
    }

    return { ok: true, ...(rpcData as Record<string, unknown>) };
  });

// Requests account deletion. Sets profiles.deletion_requested_at for the
// current user. An admin processes the actual removal.
import { z as _z } from "zod";

const DeletionInput = _z.object({
  reason: _z.string().max(500).optional().nullable(),
});

export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeletionInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        deletion_requested_at: new Date().toISOString(),
        deletion_reason: data.reason ?? null,
      })
      .eq("id", context.userId);
    if (error) {
      logEvent({
        operation: "account.deletion_request",
        status: "failure",
        category: "ACCOUNT_UPDATE_FAILED",
      });
      throw new Error("Solicitarea nu a putut fi salvată. Încearcă din nou.");
    }
    return { ok: true };
  });

export const cancelAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ deletion_requested_at: null, deletion_reason: null })
      .eq("id", context.userId);
    if (error) {
      logEvent({
        operation: "account.deletion_cancel",
        status: "failure",
        category: "ACCOUNT_UPDATE_FAILED",
      });
      throw new Error("Solicitarea nu a putut fi anulată. Încearcă din nou.");
    }
    return { ok: true };
  });

// Returns basic account state for the settings page (email, is_anonymous,
// identities, deletion request timestamp).
export const getAccountSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Read the auth user (email, is_anonymous, identities) via the admin client
    // to include identity provider info.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("email, is_anonymous, deletion_requested_at, deletion_reason, created_at")
      .eq("id", context.userId)
      .maybeSingle();

    const identities = (adminUser?.user?.identities ?? []).map((i) => ({
      provider: i.provider,
      email: (i.identity_data as { email?: string } | null | undefined)?.email ?? null,
      createdAt: i.created_at ?? null,
    }));

    return {
      userId: context.userId,
      email: adminUser?.user?.email ?? profile?.email ?? null,
      isAnonymous: Boolean(
        (adminUser?.user as { is_anonymous?: boolean } | undefined)?.is_anonymous ??
        profile?.is_anonymous,
      ),
      identities,
      deletionRequestedAt: profile?.deletion_requested_at ?? null,
      deletionReason: profile?.deletion_reason ?? null,
      createdAt: profile?.created_at ?? null,
    };
  });
