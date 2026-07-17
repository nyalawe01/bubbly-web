// app/api/notebook/generate/route.ts
//
// Background generation orchestrator. The client creates a notebook_assets row
// (status 'generating') and fires this; we run the generation server-side and
// write content + status back to that row — so the result is durable even if the
// user navigates away. The client watches the row via Supabase realtime.
//
// Also checks the semantic response cache (lib/ai/cache.ts) for context-free
// requests (no Vault sources attached) — a repeat "quiz on photosynthesis, medium,
// 25 questions" resolves near-instantly instead of re-calling the model. Exam/
// guide always require sources today, so they're never cache-eligible (which also
// keeps source-derived, potentially private content out of the shared cache).
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateAsset } from "@/lib/ai/generate";
import { checkCache, writeCache, type CacheScope } from "@/lib/ai/cache";

export const maxDuration = 120;

const CACHEABLE_TYPES = new Set(["quiz", "flashcards", "summary", "slides"]);

/** Composite key so semantic similarity also has to land on matching config
 *  (difficulty/count/format/etc), not just similar topic wording. */
function buildCacheKey(type: string, config: any): string {
  if (type === "quiz") return `quiz|topic:${config.topic || ""}|difficulty:${config.difficulty || ""}|count:${config.questionCount || ""}`;
  if (type === "flashcards") return `flashcards|topic:${config.topic || ""}|difficulty:${config.difficulty || ""}|count:${config.cardCount || ""}`;
  if (type === "summary") return `summary|topic:${config.topic || ""}|length:${config.length || ""}`;
  if (type === "slides") return `slides|desc:${config.description || ""}|format:${config.format || ""}|language:${config.language || ""}|length:${config.length || ""}`;
  return "";
}

export async function POST(request: Request) {
  const { supabase, getUser } = await createSupabaseServerClient(request);
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assetId, type, config } = await request.json();
  if (!assetId || !type) {
    return NextResponse.json({ error: "assetId and type are required" }, { status: 400 });
  }

  const markReady = (title: string, content: any) =>
    supabase
      .from("notebook_assets")
      .update({ status: "ready", title, content, updated_at: new Date().toISOString() })
      .eq("id", assetId)
      .eq("user_id", user.id);

  try {
    const sources: string[] = config?.sources || [];
    const cacheEligible = CACHEABLE_TYPES.has(type) && sources.length === 0;
    const googleKey = process.env.GEMINI_API_KEY;

    if (cacheEligible && googleKey) {
      const ai = new GoogleGenAI({ apiKey: googleKey });
      const keyText = buildCacheKey(type, config || {});
      const { hit, payload, embedding } = await checkCache(ai, supabase, type as CacheScope, keyText);

      if (hit && payload) {
        await markReady(payload.title, payload.content);
        return NextResponse.json({ success: true, title: payload.title, cached: true });
      }

      const result = await generateAsset(type, supabase, user.id, config || {});
      await markReady(result.title, result.content);
      writeCache(supabase, type as CacheScope, keyText, embedding, { title: result.title, content: result.content });
      return NextResponse.json({ success: true, title: result.title });
    }

    const result = await generateAsset(type, supabase, user.id, config || {});
    await markReady(result.title, result.content);
    return NextResponse.json({ success: true, title: result.title });
  } catch (error: any) {
    await supabase
      .from("notebook_assets")
      .update({ status: "failed", error: error.message || "Generation failed", updated_at: new Date().toISOString() })
      .eq("id", assetId)
      .eq("user_id", user.id);
    return NextResponse.json({ error: error.message || "Generation failed", success: false }, { status: 500 });
  }
}
