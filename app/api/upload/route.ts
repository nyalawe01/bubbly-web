// app/api/upload/route.ts
//
// Vault upload endpoint. Extraction/embedding/summary logic now lives in
// lib/ai/ingestion.ts and is shared with the chat-attachment bridge
// (app/api/chat/attachments/process) so uploaded Vault files and chat-attached
// files are parsed identically. This route owns persistence (vault_documents +
// vault_embeddings + vault_document_images rows); ingestion.ts owns extraction.
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractFileContent, generateAISummary, chunkText, embedChunks, persistDocumentImage } from "@/lib/ai/ingestion";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) throw new Error("Missing API Keys");

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Shared extraction core — same code path used for chat attachments.
    console.log(`Processing file: ${file.name} (${file.type})`);
    const { textContent, pendingImages } = await extractFileContent(file);
    if (!textContent) {
      return NextResponse.json({ error: "Document extraction yielded no text." }, { status: 422 });
    }

    const aiSummary = await generateAISummary(textContent);

    const { data: docData, error: docError } = await supabase
      .from("vault_documents")
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || "unknown",
        file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        ai_summary: aiSummary,
        // Full extracted text so the Vault preview modal can render the real document
        // without reconstructing it from embedding chunks. Older documents predating
        // this column got it on their row, so the vault page falls back to the chunks.
        file_content: textContent,
        preview_status: "ready",
      })
      .select()
      .single();

    if (docError) throw new Error(`Database Error: ${docError.message}`);

    // Persist the original file bytes so a broken preview can be re-extracted
    // later through the ingestion pipeline (Phase 2 backfill). Path is scoped to
    // the owner for RLS: ${userId}/${documentId}/${filename}.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${docData.id}/${safeName}`;
    const { error: storageError } = await supabase.storage
      .from("vault-originals")
      .upload(storagePath, await file.arrayBuffer(), {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
    if (!storageError) {
      await supabase
        .from("vault_documents")
        .update({ storage_path: storagePath })
        .eq("id", docData.id);
    }
    // A storage failure is non-fatal: the extracted text + embeddings already make
    // the document usable. The backfill script handles content; only full-fidelity
    // re-extraction needs the original bytes.

    if (pendingImages.length) {
      const openaiForCaptions = new OpenAI({
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey: googleKey,
      });
      await Promise.all(
        pendingImages.map((image) => persistDocumentImage(supabase, openaiForCaptions, user.id, docData.id, image))
      );
    }

    const ai = new GoogleGenAI({ apiKey: googleKey });
    const chunks = chunkText(textContent);
    const vectors = await embedChunks(ai, chunks);

    const embeddingsToInsert = chunks.map((chunk, i) => ({
      document_id: docData.id,
      user_id: user.id,
      content: chunk,
      embedding: vectors[i] || [],
    }));

    const { error: vecError } = await supabase.from("vault_embeddings").insert(embeddingsToInsert);
    if (vecError) throw new Error(`Vector DB Error: ${vecError.message}`);

    return NextResponse.json({
      success: true,
      document: { ...docData, ai_summary: aiSummary },
    });
  } catch (error: any) {
    console.error("Omni-Parser Error:", error);
    return NextResponse.json({ error: error.message || "Upload failed." }, { status: 500 });
  }
}
