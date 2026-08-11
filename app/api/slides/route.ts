// app/api/slides/route.ts
//
// Refactored (Phase 2, Week 3-4) to write through the unified ArtifactService
// (notebook_assets). Previously duplicated generation logic and wrote straight
// to the legacy slide_history table.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSlidesContent } from "@/lib/ai/generate";
import { ArtifactService } from "@/lib/artifacts/service";

export async function POST(request: Request) {
  try {
    const { format, language, length, description, sources } = await request.json();

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
    const result = await generateSlidesContent(supabase, user.id, {
      format,
      language,
      length,
      description,
      sources,
    });
    const slideCount = result.content?.slides?.length ?? 0;
    const artifact = await service.create({
      ownerId: user.id,
      type: "slides",
      title: result.title,
      content: result.content,
      sourceDocumentIds: sources || [],
      metadata: {
        format: format || "default",
        language: language || "English",
        length: length || "default",
        slideCount,
        label: result.metadataLabel,
      },
    });

    return NextResponse.json({
      success: true,
      artifact,
      slides: result.content,
      metadata: { format, language, length, slideCount },
    });
  } catch (error: any) {
    console.error("Slides Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate slides", success: false },
      { status: 500 }
    );
  }
}
