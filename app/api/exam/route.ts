// app/api/exam/route.ts
//
// Refactored (Phase 2, Week 3-4) to write through the unified ArtifactService
// (notebook_assets). Previously duplicated generation logic and wrote straight
// to the legacy exam_history table.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateExamContent } from "@/lib/ai/generate";
import { ArtifactService } from "@/lib/artifacts/service";

export async function POST(request: Request) {
  try {
    const { sourceIds, examType, config } = await request.json();

    if (!sourceIds || sourceIds.length === 0) {
      return NextResponse.json({ error: "No vault sources selected." }, { status: 400 });
    }

    const googleKey = process.env.GEMINI_API_KEY;
    if (!googleKey) throw new Error("Missing Gemini API Key");

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (examType !== "guide" && examType !== "exam") {
      return NextResponse.json({ error: "examType must be 'guide' or 'exam'." }, { status: 400 });
    }

    const service = new ArtifactService(supabase);
    const result = await generateExamContent(supabase, user.id, {
      sources: sourceIds,
      examType,
      config,
    });
    const artifactType = examType === "guide" ? "study_guide" : "exam_prep";
    const artifact = await service.create({
      ownerId: user.id,
      type: artifactType,
      title: result.title,
      content: result.content,
      sourceDocumentIds: sourceIds,
      metadata: {
        examType,
        difficulty: config?.difficulty || "medium",
        label: result.metadataLabel,
      },
    });

    return NextResponse.json({
      success: true,
      artifact,
      examType,
      content: result.content,
      metadata: { examType, difficulty: config?.difficulty || "medium", sourceIds },
    });
  } catch (error: any) {
    console.error("Exam Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate exam." }, { status: 500 });
  }
}
