// app/api/chat/attachments/promote/route.ts
//
// Promotes a chat-attached file's already-extracted text into the student's
// permanent Vault — without re-running OCR/vision. Reuses lib/ai/ingestion's
// chunkText + embedChunks so the resulting document is retrievable by chat RAG
// exactly like a normally uploaded file.
//
// Body: { file_name, file_type, content, file_size? }
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateAISummary, chunkText, embedChunks, EMBEDDING_MODELS } from "@/lib/ai/ingestion";

export async function POST(request: Request) {
  try {
    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { file_name, file_type, content, file_size } = await request.json();
    if (!file_name || !content) {
      return NextResponse.json({ error: "file_name and content are required" }, { status: 400 });
    }

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) throw new Error("Missing GEMINI_API_KEY for embedding.");

    const ai = new GoogleGenAI({ apiKey: googleKey });

    const text = String(content).trim();
    const aiSummary = await generateAISummary(text);

    const { data: docData, error: docError } = await supabase
      .from("vault_documents")
      .insert({
        user_id: user.id,
        file_name,
        file_type: file_type || "unknown",
        file_size: file_size ? `${(Number(file_size) / (1024 * 1024)).toFixed(2)} MB` : `${(Buffer.byteLength(text) / (1024 * 1024)).toFixed(2)} MB`,
        ai_summary: aiSummary,
        file_content: text,
      })
      .select()
      .single();
    if (docError) throw new Error(`Database Error: ${docError.message}`);

    const chunks = chunkText(text);
    const vectors = await embedChunks(ai, chunks);
    const embeddingsToInsert = chunks.map((chunk, i) => ({
      document_id: docData.id,
      user_id: user.id,
      content: chunk,
      embedding: vectors[i] || [],
    }));
    const { error: vecError } = await supabase.from("vault_embeddings").insert(embeddingsToInsert);
    if (vecError) throw new Error(`Vector DB Error: ${vecError.message}`);

    // Log the promotion usage (fire-and-forget).
    await supabase.from("usage_events").insert({
      user_id: user.id,
      feature_name: "vault_promote",
      model_used: EMBEDDING_MODELS[0],
      provider: "gemini",
      tokens_used: Math.ceil(text.length / 4 * 2),
      estimated_cost: (text.length / 1000) * 0.0003,
      metadata: { document_id: docData.id, file_name },
    }).then(() => {}, () => {});

    return NextResponse.json({ success: true, document: { ...docData, ai_summary: aiSummary } });
  } catch (error: any) {
    console.error("Promote to vault failed:", error);
    return NextResponse.json({ error: error.message || "Promote failed." }, { status: 500 });
  }
}
