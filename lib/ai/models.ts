// lib/ai/models.ts
//
// One place that decides WHICH model(s) run each job, and a callModel() wrapper
// that owns provider selection AND cross-provider failover — not just a factory
// that hands back a client for a single hardcoded model. Every tier is an ORDERED
// LIST of candidates; callModel() tries them in sequence, falling through to the
// next one on a capacity/quota/transient-server error (402/413/429/5xx) so a
// single provider's rate limit or deprecation doesn't take the whole feature
// down. This exists because of two real incidents, not speculative resilience:
//   - Groq's on-demand tier has hard per-minute AND per-day token caps shared
//     across every route on the same tier — one large quiz request or a busy
//     day can 500 chat and every generator feature simultaneously.
//   - Groq deprecated llama-3.3-70b-versatile and llama-3.1-8b-instant (announced
//     2026-06-17) with zero code-level warning beyond an email — a single model ID
//     with no fallback means a vendor deprecation is a full outage, not a Tuesday.
//
// Tiering: only two providers, Groq and Google Gemini (no OpenRouter for now).
// Gemini runs through Google's OpenAI-compatible endpoint on the same
// GEMINI_API_KEY, so all tiers share one client shape via callModel().
//   - chatFast    : GPT-OSS 120B (Groq) -> Gemini 3.6 Flash — everyday chat
//   - chatExpert  : Gemini 3.6 Flash -> 3.5 Flash — the "Expert" pill, deeper reasoning
//   - chatVision  : Gemini 3.6 Flash (native vision) — image-understanding chat
//   - router      : GPT-OSS 20B (Groq) -> Gemini 3.5 Flash Lite — intent classifier (must be fast/cheap)
//   - generator   : Gemini 3.6 Flash -> 3.5 Flash -> GPT-OSS 120B (Groq) — bulk structured content:
//                   quiz/flashcards/slides/summary/exam/notebook-chat/diagrams
//   - generatorPrecise : Gemini 3.6 Flash -> 3.5 Flash -> GPT-OSS 120B — output where a
//                   wrong answer is a trust failure, not a quality nit (AI grading).
// NOTE: model IDs are pinned to what THIS Gemini key actually serves. Older
// gemini-2.5-* chat models 404 on the OpenAI-compatible endpoint ("no longer
// available to new users") and the paid Pro tiers 429, so the flash family is
// the reliable set here.
import OpenAI from "openai";

export type Provider = "groq" | "gemini";

export interface ModelCandidate {
  provider: Provider;
  model: string;
  // Per-candidate params merged into every call using it — e.g. Groq's GPT-OSS
  // models reason on every request with no way to disable it (confirmed against
  // Groq's docs), only throttle it via reasoning_effort: "low"/"medium"/"high".
  // Reasoning tokens count against max_tokens and arrive in a separate `reasoning`
  // field (never mixed into `content`, streaming or not) — "low" keeps that
  // overhead small instead of eating the whole budget on tiny classification calls.
  extraParams?: Record<string, unknown>;
}

const GROQ_LOW_REASONING = { reasoning_effort: "low" };

export const MODELS = {
  chatFast: [
    { provider: "groq", model: "openai/gpt-oss-120b", extraParams: GROQ_LOW_REASONING },
    { provider: "gemini", model: "gemini-3.6-flash" },
  ],
  chatExpert: [
    { provider: "gemini", model: "gemini-3.6-flash" },
    { provider: "gemini", model: "gemini-3.5-flash" },
  ],
  chatVision: [
    { provider: "gemini", model: "gemini-3.6-flash" },
    { provider: "gemini", model: "gemini-3.5-flash" },
    { provider: "groq", model: "openai/gpt-oss-120b", extraParams: GROQ_LOW_REASONING },
  ],
  router: [
    { provider: "groq", model: "openai/gpt-oss-20b", extraParams: GROQ_LOW_REASONING },
    { provider: "gemini", model: "gemini-3.5-flash-lite" },
  ],
  generator: [
    { provider: "gemini", model: "gemini-3.6-flash" },
    { provider: "gemini", model: "gemini-3.5-flash" },
    { provider: "groq", model: "openai/gpt-oss-120b", extraParams: GROQ_LOW_REASONING },
  ],
  generatorPrecise: [
    { provider: "gemini", model: "gemini-3.6-flash" },
    { provider: "gemini", model: "gemini-3.5-flash" },
    { provider: "groq", model: "openai/gpt-oss-120b", extraParams: GROQ_LOW_REASONING },
  ],
} satisfies Record<string, ModelCandidate[]>;

// Image generation is NOT OpenAI-chat-compatible, so it does NOT go through
// getClient()/callModel() below — it has its own adapter in app/api/image/route.ts.
// Primary is ByteDance Seedream 4.5 via fal.ai (higher quality, ~$0.04/image);
// fallback is Google Imagen on the existing GEMINI_API_KEY, so a fal outage or a
// missing FAL_KEY never fully breaks image generation. Swap models by editing here.
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
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
};

const KEY_ENV: Record<Provider, string> = {
  groq: "GROQ_API_KEY",
  gemini: "GEMINI_API_KEY",
};

/** OpenAI-compatible client for a provider. Throws a clear error if its key is unset. */
export function getClient(provider: Provider): OpenAI {
  const apiKey = process.env[KEY_ENV[provider]];
  if (!apiKey) throw new Error(`Missing ${KEY_ENV[provider]} — required for the ${provider} model tier.`);
  return new OpenAI({ baseURL: BASE_URLS[provider], apiKey });
}

/** Which chat model tier to use for a given UI model pill. */
export function chatModelFor(modelType?: string): ModelCandidate[] {
  if (modelType === "expert") return MODELS.chatExpert;
  if (modelType === "vision" || modelType === "gemini") return MODELS.chatVision;
  return MODELS.chatFast; // "instant" / default
}

// Failover triggers: capacity/quota/availability errors, not request-shape bugs.
//   402 = out of credits, 404 = model doesn't exist — a FULLY
//   decommissioned model (not just soft-deprecated) 404s rather than erroring at
//   generation time, and that's exactly the scenario this ladder exists for, so it
//   must be in this set. 413 = request too large for the provider's per-request
//   token cap, 429 = rate limited, 5xx = provider having a bad time.
// A 400 (malformed request/schema) or 401 (bad key) would fail identically on
// every candidate, so don't burn the whole ladder chasing those — surface them
// immediately instead of masking a real bug behind three retries.
const FAILOVER_STATUSES = new Set([402, 404, 413, 429, 500, 502, 503, 504]);

/**
 * Tries each model candidate in order, calling chat.completions.create with the
 * caller's params. Works for both streaming and non-streaming calls — a capacity
 * error surfaces as the awaited create() call itself rejecting, before any stream
 * is consumed, so there's no risk of failing over mid-stream. Throws the last
 * error if every candidate is exhausted.
 */
export async function callModel(
  candidates: ModelCandidate[],
  params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParams, "model">
): Promise<any> {
  if (!candidates.length) throw new Error("callModel: no model candidates configured.");
  let lastError: any;
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    try {
      const client = getClient(candidate.provider);
      const result: any = await client.chat.completions.create({
        ...params,
        ...(candidate.extraParams || {}),
        model: candidate.model,
      } as any);
      // Non-invasive: callers that don't care (nearly all of them) see the normal
      // OpenAI.Chat.Completion/Stream shape untouched. Callers that DO care which
      // candidate actually served the request (e.g. cache-write logging) can read
      // this off the result instead of callModel() needing a different return shape.
      if (result && typeof result === "object") result._modelUsed = `${candidate.provider}/${candidate.model}`;
      return result;
    } catch (err: any) {
      lastError = err;
      const status = err?.status;
      const isLastCandidate = i === candidates.length - 1;
      if (isLastCandidate || !FAILOVER_STATUSES.has(status)) throw err;
      console.warn(
        `callModel: ${candidate.provider}/${candidate.model} failed (${status ?? "no status"}) — trying next candidate.`,
        err?.message
      );
    }
  }
  throw lastError;
}
