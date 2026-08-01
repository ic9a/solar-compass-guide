// Offer upload lifecycle server functions.
//
// Flow:
//  1. Client calls initOfferUpload with filename/mime/size.
//  2. Server creates offers + offer_files rows and returns a signed upload URL.
//  3. Client PUTs the file to the signed URL (direct to Storage).
//  4. Client calls finalizeOfferUpload to mark it uploaded.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { OfferUploadInitSchema, OfferUploadFinalizeSchema } from "@/lib/schemas";
import { rateLimitOrThrow } from "@/lib/rate-limit.server";
import { logEvent } from "@/lib/observability.server";

const BUCKET = "offer-documents";

function sanitizeName(input: string): string {
  const cleaned = input.replace(/[^\w.\- ]+/g, "_").slice(0, 200);
  return cleaned || "document";
}

export function detectAllowedFileType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  )
    return "application/pdf";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

function mimeMatches(declared: string, detected: string): boolean {
  if (declared === "image/jpg") return detected === "image/jpeg";
  return declared === detected;
}

export const initOfferUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OfferUploadInitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const startedAt = Date.now();
    await rateLimitOrThrow(context.userId, "upload-init", 8);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Opportunistically remove this user's abandoned, never-finalized uploads.
    // Failure is non-blocking: a new valid upload must not be lost because
    // maintenance could not run.
    const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
    const { data: abandoned } = await context.supabase
      .from("offer_files")
      .select("offer_id, storage_path")
      .is("uploaded_at", null)
      .lt("created_at", staleBefore)
      .limit(20);
    if (abandoned?.length) {
      const paths = abandoned.map((row) => row.storage_path);
      const offerIds = [...new Set(abandoned.map((row) => row.offer_id))];
      const { error: removalError } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
      if (!removalError) {
        await context.supabase
          .from("offers")
          .delete()
          .eq("user_id", context.userId)
          .in("id", offerIds);
        logEvent({
          operation: "upload.cleanup",
          status: "success",
          category: "ABANDONED_UPLOADS_REMOVED",
        });
      } else {
        logEvent({
          operation: "upload.cleanup",
          status: "failure",
          category: "ABANDONED_UPLOAD_STORAGE_CLEANUP_FAILED",
        });
      }
    }

    // 1. Insert offer + file rows via user-context Supabase client so RLS enforces ownership.
    const { data: offer, error: offerErr } = await context.supabase
      .from("offers")
      .insert({
        user_id: context.userId,
        source_method: "upload",
        status: "draft",
      })
      .select("id")
      .single();
    if (offerErr || !offer) {
      logEvent({
        operation: "upload.init",
        status: "failure",
        category: "OFFER_CREATE_FAILED",
        durationMs: Date.now() - startedAt,
      });
      throw new Error("Nu am putut crea oferta. Încearcă din nou.");
    }

    const safe = sanitizeName(data.originalFilename);
    const storagePath = `${context.userId}/${offer.id}/${Date.now()}_${safe}`;

    const { error: fileErr } = await context.supabase.from("offer_files").insert({
      offer_id: offer.id,
      user_id: context.userId,
      storage_path: storagePath,
      original_filename: data.originalFilename,
      mime_type: data.mimeType,
      file_size_bytes: data.fileSizeBytes,
      delete_after: new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
    });
    if (fileErr) {
      await context.supabase
        .from("offers")
        .delete()
        .eq("id", offer.id)
        .eq("user_id", context.userId);
      logEvent({
        operation: "upload.init",
        status: "failure",
        category: "UPLOAD_RECORD_CREATE_FAILED",
        durationMs: Date.now() - startedAt,
      });
      throw new Error("Nu am putut înregistra fișierul.");
    }

    // 2. Create signed upload URL via admin client (bucket is private).
    const { data: signed, error: signedErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);
    if (signedErr || !signed) {
      await context.supabase
        .from("offers")
        .delete()
        .eq("id", offer.id)
        .eq("user_id", context.userId);
      logEvent({
        operation: "upload.init",
        status: "failure",
        category: "SIGNED_UPLOAD_CREATE_FAILED",
        durationMs: Date.now() - startedAt,
      });
      throw new Error("Nu am putut genera link-ul de încărcare.");
    }

    logEvent({
      operation: "upload.init",
      status: "success",
      durationMs: Date.now() - startedAt,
    });
    return {
      offerId: offer.id,
      signedUrl: signed.signedUrl,
    };
  });

export const finalizeOfferUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OfferUploadFinalizeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const startedAt = Date.now();
    await rateLimitOrThrow(context.userId, "upload-finalize", 12);
    const { data: file, error: lookupError } = await context.supabase
      .from("offer_files")
      .select("storage_path, mime_type, file_size_bytes, uploaded_at")
      .eq("offer_id", data.offerId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (lookupError || !file) throw new Error("Fișierul nu există sau nu îți aparține.");
    if (file.uploaded_at) return { ok: true, alreadyFinalized: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: downloaded, error: downloadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(file.storage_path);
    if (downloadError || !downloaded) {
      logEvent({
        operation: "upload.finalize",
        status: "failure",
        category: "UPLOAD_OBJECT_MISSING",
        durationMs: Date.now() - startedAt,
      });
      throw new Error("Încărcarea nu a fost găsită. Reîncearcă transferul documentului.");
    }

    const bytes = new Uint8Array(await downloaded.arrayBuffer());
    const detectedMime = detectAllowedFileType(bytes);
    const declaredSize = Number(file.file_size_bytes ?? 0);
    const validSize =
      bytes.byteLength > 0 &&
      bytes.byteLength <= 20 * 1024 * 1024 &&
      declaredSize === bytes.byteLength;
    const validPdfEnding =
      detectedMime !== "application/pdf" ||
      new TextDecoder()
        .decode(bytes.slice(Math.max(0, bytes.byteLength - 1_024)))
        .includes("%%EOF");
    if (
      !detectedMime ||
      !file.mime_type ||
      !mimeMatches(file.mime_type, detectedMime) ||
      !validSize ||
      !validPdfEnding
    ) {
      await supabaseAdmin.storage.from(BUCKET).remove([file.storage_path]);
      await context.supabase
        .from("offers")
        .update({ status: "failed" })
        .eq("id", data.offerId)
        .eq("user_id", context.userId);
      logEvent({
        operation: "upload.finalize",
        status: "failure",
        category: "UPLOAD_CONTENT_INVALID",
        durationMs: Date.now() - startedAt,
      });
      throw new Error(
        "Conținutul fișierului nu corespunde formatului declarat sau documentul este corupt.",
      );
    }

    const now = new Date().toISOString();

    const { error: fileErr } = await context.supabase
      .from("offer_files")
      .update({ uploaded_at: now })
      .eq("offer_id", data.offerId)
      .eq("user_id", context.userId);
    if (fileErr) {
      throw new Error("Nu am putut confirma încărcarea fișierului.");
    }

    const { error: offerErr } = await context.supabase
      .from("offers")
      .update({ status: "uploaded" })
      .eq("id", data.offerId)
      .eq("user_id", context.userId);
    if (offerErr) {
      throw new Error("Nu am putut actualiza starea ofertei.");
    }
    logEvent({
      operation: "upload.finalize",
      status: "success",
      durationMs: Date.now() - startedAt,
    });
    return { ok: true };
  });

export const listMyOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("offers")
      .select("id, source_method, status, supplier_name, total_price_lei, system_kwp, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Joined "account history" query — one row per offer with everything the
// dashboard needs. Owner-scoped via RLS (uses context.supabase).
export const listMyAccountHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: offers, error: oe } = await supabase
      .from("offers")
      .select("id, source_method, status, supplier_name, total_price_lei, system_kwp, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (oe) throw new Error(oe.message);
    if (!offers || offers.length === 0) return [];

    const offerIds = offers.map((o) => o.id);

    const [filesRes, extrRes, anaRes] = await Promise.all([
      supabase
        .from("offer_files")
        .select("offer_id, original_filename, uploaded_at")
        .in("offer_id", offerIds),
      supabase
        .from("offer_extractions")
        .select("offer_id, status, overall_confidence, failure_message, updated_at")
        .in("offer_id", offerIds),
      supabase
        .from("offer_analyses")
        .select("id, offer_id, status, overall_score, is_paid, paid_at, updated_at")
        .in("offer_id", offerIds),
    ]);

    const filesByOffer = new Map<string, { filename: string | null; uploadedAt: string | null }>();
    for (const f of filesRes.data ?? []) {
      // pick the most recent file per offer
      const cur = filesByOffer.get(f.offer_id);
      if (!cur || (f.uploaded_at && (!cur.uploadedAt || f.uploaded_at > cur.uploadedAt))) {
        filesByOffer.set(f.offer_id, {
          filename: f.original_filename ?? null,
          uploadedAt: f.uploaded_at ?? null,
        });
      }
    }

    const extByOffer = new Map<string, (typeof extrRes.data extends (infer T)[] | null ? T : never)>();
    for (const e of extrRes.data ?? []) {
      const cur = extByOffer.get(e.offer_id);
      if (!cur || (e.updated_at && (!cur.updated_at || e.updated_at > cur.updated_at))) {
        extByOffer.set(e.offer_id, e);
      }
    }

    const anaByOffer = new Map<string, (typeof anaRes.data extends (infer T)[] | null ? T : never)>();
    for (const a of anaRes.data ?? []) {
      anaByOffer.set(a.offer_id, a);
    }

    return offers.map((o) => {
      const ext = extByOffer.get(o.id);
      const ana = anaByOffer.get(o.id);
      const file = filesByOffer.get(o.id);
      return {
        offerId: o.id,
        sourceMethod: o.source_method,
        offerStatus: o.status,
        supplierName: o.supplier_name,
        systemKwp: o.system_kwp,
        totalPriceLei: o.total_price_lei,
        createdAt: o.created_at,
        filename: file?.filename ?? null,
        uploadedAt: file?.uploadedAt ?? null,
        extractionStatus: ext?.status ?? null,
        extractionConfidence: ext?.overall_confidence ?? null,
        extractionError: ext?.failure_message ?? null,
        analysisId: ana?.id ?? null,
        analysisStatus: ana?.status ?? null,
        overallScore: ana?.overall_score ?? null,
      };
    });
  });
