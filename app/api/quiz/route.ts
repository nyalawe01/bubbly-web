// app/api/quiz/route.ts
//
// Refactored (Phase 2, Week 3-4) to write through the unified ArtifactService
// (notebook_assets). Previously duplicated generation logic and wrote straight
// to the legacy quiz_history table.
//
// IMPORTANT: this file MUST be named "route.ts", not "routes.ts". Next.js App
// Router only registers files literally named route.ts as endpoints.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateQuizContent } from "@/lib/ai/generate";
import { ArtifactService } from "@/lib/artifacts/service";

const QUESTION_COUNTS: Record<string, number> = { fewer: 20, standard: 25, more: 35 };

export async function POST(request: Request) {
  try {
    const { questionCount, difficulty, topic, sources, minQuestions } = await request.json();

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) {
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // minQuestions override lives in this route; generateQuizContent reads
    // config.questionCount, so resolve the final count before delegating.
    let numQuestions = QUESTION_COUNTS[questionCount] ?? QUESTION_COUNTS.standard;
    if (minQuestions && minQuestions > numQuestions) numQuestions = minQuestions;

    const service = new ArtifactService(supabase);
    const result = await generateQuizContent(supabase, user.id, {
      questionCount,
      difficulty,
      topic,
      sources,
    });
    const artifact = await service.create({
      ownerId: user.id,
      type: "quiz",
      title: result.title,
      content: result.content,
      sourceDocumentIds: sources || [],
      metadata: {
        difficulty: difficulty || "medium",
        topic: topic || null,
        questionCount: result.content?.questions?.length ?? numQuestions,
        label: result.metadataLabel,
      },
    });

    return NextResponse.json({
      success: true,
      artifact,
      quiz: result.content,
      metadata: { questionCount: numQuestions, difficulty, topic },
    });
  } catch (error: any) {
    console.error("Quiz Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate quiz", success: false },
      { status: 500 }
    );
  }
}
