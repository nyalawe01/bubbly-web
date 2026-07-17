// lib/ai/vault.ts
// Shared Vault access — this used to be copy-pasted (with drift) across chat/quiz/
// flashcards. One implementation now, used everywhere.

import { GoogleGenAI } from "@google/genai";
import { GENERATED_CONTEXT_RULES } from "./prompts";

// The old text-embedding-004 / embedding-001 models 404 on current Gemini keys.
// gemini-embedding-001 is the live model — but it defaults to 3072 dims, while the
// vault_embeddings column and match_documents RPC are vector(768), so we force 768.
const EMBEDDING_MODELS = ["gemini-embedding-001", "gemini-embedding-2"];
const EMBED_DIM = 768;

/** Embeds a single string of text, trying fallback models until one works.
 *  Always returns a 768-dim vector to match the vault schema. */
export async function embedText(ai: GoogleGenAI, text: string): Promise<number[]> {
  for (const model of EMBEDDING_MODELS) {
    try {
      const result = await ai.models.embedContent({ model, contents: text, config: { outputDimensionality: EMBED_DIM } });
      const values = result.embeddings?.[0]?.values;
      if (values && values.length > 0) return values;
    } catch {
      continue;
    }
  }
  return [];
}

export interface VaultChunk {
  content: string;
  document_id?: string;
  file_name?: string;
  similarity?: number;
}

/** Semantic search across the student's whole Vault. Used by chat for implicit retrieval.
 *  Scoped to userId server-side (via the match_documents RPC's p_user_id param) so one
 *  student's notes never leak into another student's chat context. */
export async function fetchVaultContext(
  supabase: any,
  queryEmbedding: number[],
  userId: string,
  opts: { matchCount?: number; matchThreshold?: number } = {}
): Promise<VaultChunk[]> {
  if (!queryEmbedding.length) return [];
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: opts.matchThreshold ?? 0.35,
    match_count: opts.matchCount ?? 5,
    p_user_id: userId,
  });
  if (error || !data) return [];
  return data;
}

/** Direct fetch of specific selected source documents. Used by quiz/flashcards/slides
 *  when the student has explicitly picked notes to generate from. Filters by userId as
 *  well as document_id — a client could otherwise pass another student's document IDs
 *  and pull their content into a generated asset. Returns chunks tagged with source id +
 *  filename (same [src=N | filename] convention as formatVaultContextBlock) so generator
 *  prompts can cite consistently with chat. */
export async function fetchSourceContent(
  supabase: any,
  sourceIds: string[],
  userId: string,
  limit = 50
): Promise<string> {
  if (!sourceIds || sourceIds.length === 0) return "";
  const { data: chunks, error } = await supabase
    .from("vault_embeddings")
    .select("content, document_id, vault_documents(file_name)")
    .eq("user_id", userId)
    .in("document_id", sourceIds)
    .limit(limit);
  if (error || !chunks) return "";

  const seen = new Map<string, number>();
  return chunks
    .map((c: any) => {
      const fileName = c.vault_documents?.file_name || "Untitled";
      if (!seen.has(fileName)) seen.set(fileName, seen.size + 1);
      return `[src=${seen.get(fileName)} | ${fileName}] ${c.content}`;
    })
    .join("\n\n");
}

/** Formats retrieved chunks into a system-prompt-ready block, tagged with source id +
 *  filename per GENERATED_CONTEXT_RULES so the model can cite ("[Biology Ch.4]") instead
 *  of just silently drawing on unattributed context. Returns "" if empty, so it's always
 *  safe to append directly without an if-check at the call site. */
export function formatVaultContextBlock(chunks: VaultChunk[]): string {
  if (!chunks.length) return "";
  const seen = new Map<string, number>();
  const body = chunks
    .map((c) => {
      const fileName = c.file_name || "Untitled";
      if (!seen.has(fileName)) seen.set(fileName, seen.size + 1);
      return `[src=${seen.get(fileName)} | ${fileName}] ${c.content}`;
    })
    .join("\n");
  return `\n\n${GENERATED_CONTEXT_RULES}\n\nCONTEXT:\n${body}`;
}
