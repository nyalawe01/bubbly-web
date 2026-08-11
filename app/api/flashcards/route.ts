// app/api/flashcards/route.ts
//
// Refactored (Phase 2, Week 3-4) to write through the unified ArtifactService
// (notebook_assets). This route previously duplicated generation logic and
// wrote straight to the legacy flashcard_history table.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateFlashcardsContent } from "@/lib/ai/generate";
import { ArtifactService } from "@/lib/artifacts/service";

export async function POST(request: Request) {
  try {
    const { cardCount, difficulty, topic, sources } = await request.json();

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) {
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new ArtifactService(supabase);
    const result = await generateFlashcardsContent(supabase, user.id, {
      cardCount,
      difficulty,
      topic,
      sources,
    });
    const artifact = await service.create({
      ownerId: user.id,
      type: "flashcards",
      title: result.title,
      content: result.content,
      sourceDocumentIds: sources || [],
      metadata: {
        difficulty: difficulty || "medium",
        topic: topic || null,
        cardCount: result.content?.cards?.length ?? cardCount,
        label: result.metadataLabel,
      },
    });

    return NextResponse.json({
      success: true,
      artifact,
      flashcards: result.content,
      metadata: { cardCount, difficulty, topic },
    });
  } catch (error: any) {
    console.error("Flashcard Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate flashcards", success: false },
      { status: 500 }
    );
  }
}
