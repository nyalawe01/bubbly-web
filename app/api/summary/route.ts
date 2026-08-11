// app/api/summary/route.ts
//
// Refactored (Phase 2, Week 3-4) to write through the unified ArtifactService
// (notebook_assets). Previously duplicated generation logic and wrote straight
// to the legacy summary_history table.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSummaryContent } from "@/lib/ai/generate";
import { ArtifactService } from "@/lib/artifacts/service";

export async function POST(request: Request) {
  try {
    const { topic, sources, length } = await request.json();

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
    const result = await generateSummaryContent(supabase, user.id, {
      topic,
      sources,
      length,
    });
    const artifact = await service.create({
      ownerId: user.id,
      type: "summary",
      title: result.title,
      content: result.content,
      sourceDocumentIds: sources || [],
      metadata: {
        topic: topic || null,
        length: length === "detailed" ? "detailed" : "brief",
        label: result.metadataLabel,
      },
    });

    return NextResponse.json({
      success: true,
      artifact,
      summary: result.content,
      metadata: { topic },
    });
  } catch (error: any) {
    console.error("Summary Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate summary", success: false },
      { status: 500 }
    );
  }
}
