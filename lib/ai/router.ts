// lib/ai/router.ts
// A cheap, structured classification call that decides — per-turn — whether web
// search, an image, or a diagram is warranted, BEFORE the main generation call.
// Runs on Groq's llama-3.1-8b-instant (see lib/ai/models.ts `router`): near-instant
// so it no longer blocks the reply, and is run in PARALLEL with Vault retrieval by
// the chat route.

import { callModel, MODELS } from "./models";
import { ROUTER_SYSTEM_PROMPT } from "./prompts";

export type ModelHint = "instant" | "expert" | "vision";

export interface RouteDecision {
  needsWebSearch: boolean;
  needsDiagram: boolean;
  needsImage: boolean;
  searchQuery: string | null;
  imagePrompt: string | null;
  // Which chat tier best fits this message — only consulted when the client's
  // modelType is "auto"/unset (see app/api/chat/route.ts). An explicit model
  // choice always wins over this.
  modelHint: ModelHint;
}

const FALLBACK: RouteDecision = {
  needsWebSearch: false,
  needsDiagram: false,
  needsImage: false,
  searchQuery: null,
  imagePrompt: null,
  modelHint: "instant",
};

const VALID_HINTS = new Set(["instant", "expert", "vision"]);

export async function classifyIntent(message: string): Promise<RouteDecision> {
  try {
    const response = await callModel(MODELS.router, {
      messages: [
        { role: "system", content: ROUTER_SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      max_tokens: 150,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return {
      needsWebSearch: !!parsed.needsWebSearch,
      needsDiagram: !!parsed.needsDiagram,
      needsImage: !!parsed.needsImage,
      searchQuery: parsed.searchQuery || null,
      imagePrompt: parsed.imagePrompt || null,
      modelHint: VALID_HINTS.has(parsed.modelHint) ? parsed.modelHint : "instant",
    };
  } catch (e) {
    // Fail closed: if classification breaks, default to plain chat rather than
    // risking a broken/over-decorated response.
    console.warn("Intent classification failed, defaulting to plain chat:", e);
    return FALLBACK;
  }
}