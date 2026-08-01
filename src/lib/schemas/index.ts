// Shared Zod schemas used by server functions and client forms.
import { z } from "zod";

export const PvgisRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  kwp: z.number().min(0.5).max(50),
  tilt: z.number().min(0).max(90).default(30),
  aspect: z.number().min(-180).max(180).default(0),
  loss: z.number().min(0).max(45).default(14),
});
export type PvgisRequest = z.infer<typeof PvgisRequestSchema>;

export const ContactSchema = z.object({
  name: z.string().trim().min(2, "Numele este prea scurt").max(120),
  email: z.string().trim().email("Adresă de email invalidă").max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, "Scrie măcar câteva cuvinte").max(4000),
});
export type ContactInput = z.infer<typeof ContactSchema>;

export const OfferUploadInitSchema = z.object({
  originalFilename: z.string().min(1).max(255),
  mimeType: z.enum([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ]),
  fileSizeBytes: z.number().int().positive().max(20 * 1024 * 1024, "Fișier prea mare (max 20 MB)"),
});
export type OfferUploadInitInput = z.infer<typeof OfferUploadInitSchema>;

export const OfferUploadFinalizeSchema = z.object({
  offerId: z.string().uuid(),
});

export const RecommendationSaveSchema = z.object({
  inputs: z.record(z.string(), z.unknown()),
  monthlyConsumptionKwh: z.array(z.number()).length(12).optional(),
  annualConsumptionKwh: z.number().positive().optional(),
  scenarios: z.array(z.record(z.string(), z.unknown())).optional(),
  selectedScenarioId: z.string().optional(),
  calculationVersion: z.number().int().optional(),
  assumptionsVersion: z.number().int().optional(),
  status: z.enum(["draft", "complete"]).default("draft"),
  sessionId: z.string().uuid().optional(),
});
export type RecommendationSaveInput = z.infer<typeof RecommendationSaveSchema>;
