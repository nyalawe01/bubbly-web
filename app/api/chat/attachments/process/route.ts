// app/api/chat/attachments/process/route.ts
//
// Phase 1.0 — the P0 fix for the "AI ignores what the student attaches" trust gap.
//
// When a student attaches a file to a CHAT (not the Vault), this endpoint runs
// that file through the EXACT same ingestion pipeline as app/api/upload
// (lib/ai/ingestion.ts#extractFileContent) and returns the extracted text. The
// text is then sent to the model by the chat route as [SOURCE: ATTACHED FILE]
// context — so a PDF pasted into chat is actually read by the AI.
//
// Important: this NEVER writes to vault_documents. Chat attachments are transient
// context, not permanent knowledge. The student can promote a specific attachment to
// the Vault separately via app/api/chat/attachments/promote.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractFileContent } from "@/lib/ai/ingestion";

export async function POST(request: Request) {
  try {
    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) throw new Error("Missing GEMINI_API_KEY for vision extraction.");

    let file: File | null = null;
    let body: any = null;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      file = formData.get("file") as File | null;
    } else {
      body = await request.json();
      file = body?.file;
    }

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Shared extraction core — identical to Vault uploads.
    const { textContent } = await extractFileContent(file);
    if (!textContent) {
      return NextResponse.json({ error: "No text could be extracted from this file." }, { status: 422 });
    }

    // Track that we indexed it for the usage_log (one read of this attachment).
    await supabase.from("usage_events").insert({
      user_id: user.id,
      feature_name: "chat_attachment_extract",
      model_used: "gemini-3.6-flash",
      provider: "gemini",
      tokens_used: Math.ceil(textContent.length / 4),
      estimated_cost: (textContent.length / 1000) * 0.00015,
      metadata: { file_name: file.name, file_type: file.type, attachment_id: crypto.randomUUID() },
    }).then(() => {}, () => {});

    return NextResponse.json({
      success: true,
      attachment_id: crypto.randomUUID(),
      file_name: file.name,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      // Cap the context handed to the model so a 50MB pasted PDF can't blow the
      // chat context budget. The full text lives in the Vault if promoted.
      content: textContent.slice(0, 12000),
      truncated: textContent.length > 12000,
    });
  } catch (error: any) {
    console.error("Attachment processing failed:", error);
    return NextResponse.json({ error: error.message || "Processing failed." }, { status: 500 });
  }
}
