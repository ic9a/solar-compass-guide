import { createGoogleGenerativeAI } from "@ai-sdk/google";

const DEFAULT_MODEL = "gemini-3.5-flash";

export function createAnalysisModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY nu este configurat.");
  }

  const modelId = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
  const google = createGoogleGenerativeAI({ apiKey });

  return {
    model: google(modelId),
    modelId,
  };
}
