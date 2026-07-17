// lib/ai/cache.ts
//
// Lightweight semantic cache for context-free AI responses (see
// supabase/migrations/0008_ai_response_cache.sql). Shared, cross-user, non-personal
// — callers MUST only use this for requests with NO private Vault/source context;
// a response built from one student's notes must never be served to another.
import type { GoogleGenAI } from "@google/genai";
import { embedText } from "./vault";

export type CacheScope = "chat" | "quiz" | "flashcards" | "slides" | "summary";

export interface CacheCheckResult {
  hit: boolean;
  payload: any | null;
  embedding: number[]; // always returned so a miss can be written without re-embedding
}

// Calibrated empirically against gemini-embedding-001 (not assumed off generic
// caching guidance). Measured cosine similarity on this model:
//   exact-duplicate text            ~1.00
//   genuine paraphrases (3 samples) ~0.77-0.82  (e.g. "what is mitosis" vs
//                                                "explain mitosis simply" = 0.80)
//   unrelated questions             ~0.48-0.49
// A "generic" 0.93-0.96 threshold would only catch near-exact string matches and
// miss real paraphrases entirely — verified directly against the RPC, not assumed.
// 0.72 sits comfortably below the paraphrase floor with a wide margin above unrelated.
const DEFAULT_THRESHOLD = 0.72;

/** Looks for a close-enough cached response given an ALREADY-COMPUTED embedding —
 *  use this when the caller already embedded the text for another reason (chat
 *  reuses the embedding computed for Vault retrieval) so we never embed twice. */
export async function matchCache(
  supabase: any,
  scope: CacheScope,
  embedding: number[],
  threshold: number = DEFAULT_THRESHOLD
): Promise<{ hit: boolean; payload: any | null }> {
  if (!embedding.length) return { hit: false, payload: null };
  try {
    const { data, error } = await supabase.rpc("match_response_cache", {
      query_embedding: embedding,
      match_scope: scope,
      match_threshold: threshold,
    });
    if (error || !data?.length) return { hit: false, payload: null };

    const row = data[0];
    // Fire-and-forget hit-count bump — never let this block or fail the response.
    supabase
      .from("ai_response_cache")
      .update({ hit_count: (row.hit_count ?? 0) + 1, last_hit_at: new Date().toISOString() })
      .eq("id", row.id)
      .then(() => {}, () => {});

    return { hit: true, payload: row.payload };
  } catch {
    return { hit: false, payload: null };
  }
}

/** Convenience wrapper for callers with no existing embedding (the generator
 *  route): embeds keyText once, then matches. Returns the embedding either way so
 *  a miss can be written to the cache without embedding a second time. */
export async function checkCache(
  ai: GoogleGenAI,
  supabase: any,
  scope: CacheScope,
  keyText: string,
  threshold: number = DEFAULT_THRESHOLD
): Promise<CacheCheckResult> {
  const embedding = await embedText(ai, keyText);
  if (!embedding.length) return { hit: false, payload: null, embedding };
  const { hit, payload } = await matchCache(supabase, scope, embedding, threshold);
  return { hit, payload, embedding };
}

/** Fire-and-forget cache write. Never throws — a caching failure must never surface
 *  as a user-facing error on what is otherwise a successful response. */
export function writeCache(
  supabase: any,
  scope: CacheScope,
  keyText: string,
  embedding: number[],
  payload: any,
  modelUsed?: string
): void {
  if (!embedding.length) return;
  supabase
    .from("ai_response_cache")
    .insert({ scope, key_text: keyText, embedding, payload, model_used: modelUsed || null })
    .then(() => {}, (e: any) => console.warn("Cache write failed (non-fatal):", e?.message || e));
}
