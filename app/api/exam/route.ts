// app/api/exam/route.ts
import { NextResponse } from "next/server";
import { callModel, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSourceContent } from "@/lib/ai/vault";
import { GLOBAL_STYLE, GENERATED_CONTEXT_RULES, EXAM_CONTRACT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { sourceIds, examType, config } = await request.json();

    if (!sourceIds || sourceIds.length === 0) {
      return NextResponse.json({ error: "No vault sources selected." }, { status: 400 });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) throw new Error("Missing OpenRouter API Key");

    const { supabase, getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentContext = await fetchSourceContent(supabase, sourceIds, user.id, 50);
    if (!documentContext) throw new Error("Failed to retrieve document context from the vault.");

    let userPrompt = `CONTEXT:\n${documentContext}\n\n`;

    if (examType === "guide") {
      const systemPrompt = `${GLOBAL_STYLE}

${GENERATED_CONTEXT_RULES}

You're turning the student's own notes into a structured study guide.

Format the guide with:
- Main topics as ## headings
- Subtopics as ### headings
- Key definitions in **bold**
- Bullet points for lists
- Numbered steps for processes
- Tables for comparisons when relevant
- Keep each section concise but comprehensive
- Include practice questions at the end
- Include relevant diagrams using Mermaid syntax where appropriate

The guide should turn messy notes into a structured, easy-to-study outline.`;

      userPrompt += "Generate a comprehensive, well-structured study guide based on the context above.";

      const response = await callModel(MODELS.generator, {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      const guideContent = response.choices[0].message.content || "";

      await supabase.from('exam_history').insert({
        user_id: user.id,
        title: 'Study Guide',
        exam_type: 'guide',
        content: { text: guideContent },
        sources: sourceIds,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        examType: "guide",
        exam: { title: "Study Guide", content: guideContent },
        metadata: { examType: "guide", sourceIds },
      });
    } else if (examType === "exam") {
      const systemPrompt = `${EXAM_CONTRACT}

${GENERATED_CONTEXT_RULES}`;

      userPrompt += `Generate a practice exam worth ${config?.count ? config.count * 2 : 20} total marks, difficulty level: ${config?.difficulty || 'medium'}.`;

      const response = await callModel(MODELS.generator, {
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      const parsedExam = JSON.parse(response.choices[0].message.content || "{}");

      await supabase.from('exam_history').insert({
        user_id: user.id,
        title: parsedExam.title || 'Practice Exam',
        exam_type: 'exam',
        content: parsedExam,
        sources: sourceIds,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        examType: "exam",
        exam: parsedExam,
        metadata: { examType: "exam", difficulty: config?.difficulty || 'medium', sourceIds },
      });
    }

    return NextResponse.json({ error: "examType must be 'guide' or 'exam'." }, { status: 400 });

  } catch (error: any) {
    console.error("Exam Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate exam." }, { status: 500 });
  }
}
