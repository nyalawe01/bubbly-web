import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { buildNotebookContext } from "@/lib/notebooks/context";
import { callModel, chatModelFor } from "@/lib/ai/models";

export async function POST(request: Request) {
  try {
    const { notebook_id, target_date, goals } = await request.json();

    if (!notebook_id) {
      return NextResponse.json({ error: "Notebook ID is required" }, { status: 400 });
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

    // 1. Build context from the entire Notebook
    const context = await buildNotebookContext(supabase, notebook_id, user.id);
    if (!context) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    // 2. Create a placeholder artifact
    const { data: artifact, error: err } = await supabase.from("notebook_assets").insert({
      user_id: user.id,
      type: "study_plan",
      title: `Study Plan: ${context.notebook.title}`,
      content: {},
      config: { notebook_id, target_date, goals },
      status: "generating",
    }).select().single();

    if (err || !artifact) {
      return NextResponse.json({ error: "Failed to create artifact placeholder" }, { status: 500 });
    }

    // 3. Generate the Study Plan asynchronously
    (async () => {
      try {
        let systemPrompt = `You are an expert academic advisor. Create a structured study plan based on the following notebook context.
Notebook: ${context.notebook.title}
Course: ${context.notebook.course_code}
Target Exam Date: ${target_date}
Goals: ${goals}

`;
        if (context.documents.length > 0) {
          systemPrompt += "Documents:\n" + context.documents.map(d => `- ${d.file_name}: ${d.ai_summary}`).join("\n") + "\n\n";
        }

        systemPrompt += `Return the study plan strictly as JSON with this schema:
{
  "weeks": [
    {
      "week_number": 1,
      "focus": "Topic name",
      "tasks": [
        { "description": "Read chapter 1", "estimated_minutes": 60, "completed": false }
      ]
    }
  ],
  "recommendations": ["A general tip"]
}`;

        const chatModel = chatModelFor("expert");
        const response: any = await callModel(chatModel, {
          messages: [{ role: "system", content: systemPrompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        });

        const jsonContent = typeof response === "string" ? JSON.parse(response) : response;

        // Update the artifact
        await supabase.from("notebook_assets").update({
          content: jsonContent,
          status: "ready"
        }).eq("id", artifact.id);

        // Link the artifact to the notebook
        await supabase.from("notebook_artifacts").insert({
          notebook_id: notebook_id,
          artifact_id: artifact.id,
        });

      } catch (err) {
        console.error("Failed to generate study plan:", err);
        await supabase.from("notebook_assets").update({ status: "failed" }).eq("id", artifact.id);
      }
    })();

    return NextResponse.json({ success: true, artifactId: artifact.id });

  } catch (error: any) {
    console.error("Study Plan API Error:", error);
    return NextResponse.json({ error: error.message || "Execution failed." }, { status: 500 });
  }
}
