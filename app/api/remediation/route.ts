import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildNotebookContext } from "@/lib/notebooks/context";

import { callModel, chatModelFor } from "@/lib/ai/models";

export async function POST(request: Request) {
  try {
    const { notebook_id, topic } = await request.json();

    if (!notebook_id || !topic) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) {
      return NextResponse.json({ error: "Missing required API Keys" }, { status: 500 });
    }

    const context = await buildNotebookContext(supabase, notebook_id, user.id);
    if (!context) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    // 1. Generate targeted flashcards
    const { data: flashcardArtifact, error: err1 } = await supabase.from("notebook_assets").insert({
      user_id: user.id,
      type: "flashcards",
      title: `${topic} - Flashcards`,
      content: {},
      config: { notebook_id, topic, targeted: true },
      status: "generating",
    }).select().single();

    if (err1 || !flashcardArtifact) {
      return NextResponse.json({ error: "Failed to create flashcard placeholder" }, { status: 500 });
    }

    // 2. Generate targeted mini-lesson (summary)
    const { data: lessonArtifact, error: err2 } = await supabase.from("notebook_assets").insert({
      user_id: user.id,
      type: "summary",
      title: `${topic} - Mini Lesson`,
      content: {},
      config: { notebook_id, topic, targeted: true },
      status: "generating",
    }).select().single();

    if (err2 || !lessonArtifact) {
      return NextResponse.json({ error: "Failed to create lesson placeholder" }, { status: 500 });
    }

    // Async generation
    (async () => {
      try {
        let systemPrompt = `You are an expert tutor. Create targeted study materials focused strictly on the topic: "${topic}".\n`;
        if (context.documents.length > 0) {
          systemPrompt += "Source Documents:\n" + context.documents.map(d => `- ${d.file_name}: ${d.ai_summary}`).join("\n") + "\n\n";
        }

        // Generate flashcards
        const flashcardPrompt = systemPrompt + `Generate 5 flashcards specifically about ${topic}.
Return strict JSON:
{
  "flashcards": [
    { "front": "question", "back": "answer", "topics": ["${topic}"] }
  ]
}`;
        const flashcardChatModel = chatModelFor("expert");
        const fcResponse: any = await callModel(flashcardChatModel, {
          messages: [{ role: "system", content: flashcardPrompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        });

        const fcJson = typeof fcResponse === "string" ? JSON.parse(fcResponse) : fcResponse;

        await supabase.from("notebook_assets").update({
          content: fcJson.flashcards,
          status: "ready"
        }).eq("id", flashcardArtifact.id);

        await supabase.from("notebook_artifacts").insert({
          notebook_id: notebook_id,
          artifact_id: flashcardArtifact.id,
        });

        // Generate lesson
        const lessonPrompt = systemPrompt + `Generate a short mini-lesson explaining ${topic}.
Return strict JSON:
{
  "tldr": "1 sentence summary",
  "sections": [
    { "heading": "Core Concept", "points": ["point 1", "point 2"] }
  ],
  "keyTerms": [
    { "term": "term", "definition": "def" }
  ]
}`;
        const lessonResponse: any = await callModel(flashcardChatModel, {
          messages: [{ role: "system", content: lessonPrompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        });

        const lessonJson = typeof lessonResponse === "string" ? JSON.parse(lessonResponse) : lessonResponse;

        await supabase.from("notebook_assets").update({
          content: lessonJson,
          status: "ready"
        }).eq("id", lessonArtifact.id);

        await supabase.from("notebook_artifacts").insert({
          notebook_id: notebook_id,
          artifact_id: lessonArtifact.id,
        });

      } catch (err) {
        console.error("Remediation generation failed:", err);
        await supabase.from("notebook_assets").update({ status: "failed" }).eq("id", flashcardArtifact.id);
        await supabase.from("notebook_assets").update({ status: "failed" }).eq("id", lessonArtifact.id);
      }
    })();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Remediation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
