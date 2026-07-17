import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { fileId, accessToken } = await request.json();

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!driveResponse.ok) throw new Error("Failed to fetch file from Google Drive");

    const fileContent = await driveResponse.text();

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const embeddingResult = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: fileContent
    });

    const { data: doc, error } = await supabase.from('vault_documents').insert({
      file_name: `Drive_File_${fileId}`,
      file_content: fileContent,
      user_id: user.id
    }).select().single();

    if (error) throw error;

    const { error: vecError } = await supabase.from('vault_embeddings').insert({
      document_id: doc.id,
      user_id: user.id,
      content: fileContent,
      embedding: embeddingResult.embeddings?.[0]?.values || [],
    });
    if (vecError) throw vecError;

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
