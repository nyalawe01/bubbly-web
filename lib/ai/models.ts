// lib/ai/models.ts
//
// One place that decides WHICH model runs each job, and a factory that returns
// the right OpenAI-compatible client per provider. Swapping a model = editing
// one line here, not hunting through routes.
//
// Tiering (per the "fast chat, DeepSeek for depth" decision):
//   - chatFast   : Groq Llama 3.3 70B  — everyday chat, near-instant first token
//   - chatExpert : DeepSeek            — the "Expert" pill, deeper reasoning
//   - chatVision : Gemini Flash        — image-understanding chat
//   - router     : Groq Llama 3.1 8B   — the intent classifier (must be fast)
//   - generator  : DeepSeek            — quiz/flashcards/slides/summary/exam/etc.
import OpenAI from "openai";

export type Provider = "groq" | "openrouter";

export interface ModelRef {
  provider: Provider;
  model: string;
}

export const MODELS = {
  chatFast: { provider: "groq", model: "llama-3.3-70b-versatile" },
  chatExpert: { provider: "openrouter", model: "deepseek/deepseek-chat" },
  chatVision: { provider: "openrouter", model: "google/gemini-2.5-flash" },
  router: { provider: "groq", model: "llama-3.1-8b-instant" },
  // Generators (quiz/flashcards/slides/summary/exam) run on Groq's FREE tier —
  // fast, handles JSON mode, and (crucially) no OpenRouter credit wall, which was
  // 402-ing generation. Swap to "google/gemini-2.5-flash" (openrouter) for slightly
  // higher accuracy once OpenRouter credits are topped up.
  generator: { provider: "groq", model: "llama-3.3-70b-versatile" },
} satisfies Record<string, ModelRef>;

// Image generation is NOT OpenAI-chat-compatible, so it does NOT go through getClient() below —
// it has its own adapter in app/api/image/route.ts. Primary is ByteDance Seedream 4.5 via fal.ai
// (higher quality, ~$0.04/image); fallback is Google Imagen on the existing GEMINI_API_KEY, so a
// fal outage or a missing FAL_KEY never fully breaks image generation. Swap models by editing here.
export const IMAGE_MODEL = {
  primary: {
    provider: "fal" as const,
    // fal's synchronous REST endpoint is https://fal.run/<model>. Confirmed live slug for Seedream 4.5.
    model: "fal-ai/bytedance/seedream/v4.5/text-to-image",
  },
  fallback: {
    provider: "google" as const,
    // Gemini native image models (the "generateContent" image path). The old Imagen 3.0/4.0 slugs now
    // 404 ("no longer available to new users"); these are what's actually live on the Gemini API. NOTE:
    // Google's FREE tier grants zero image requests (429 limit:0) — this fallback only produces images
    // once billing is enabled on the Google project.
    models: ["gemini-2.5-flash-image", "gemini-3.1-flash-image"],
  },
};

const BASE_URLS: Record<Provider, string> = {
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
};

const KEY_ENV: Record<Provider, string> = {
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

/** OpenAI-compatible client for a provider. Throws a clear error if its key is unset. */
export function getClient(provider: Provider): OpenAI {
  const apiKey = process.env[KEY_ENV[provider]];
  if (!apiKey) throw new Error(`Missing ${KEY_ENV[provider]} — required for the ${provider} model tier.`);
  return new OpenAI({ baseURL: BASE_URLS[provider], apiKey });
}

/** Which chat model to use for a given UI model pill. */
export function chatModelFor(modelType?: string): ModelRef {
  if (modelType === "expert") return MODELS.chatExpert;
  if (modelType === "vision" || modelType === "gemini") return MODELS.chatVision;
  return MODELS.chatFast; // "instant" / default
}
