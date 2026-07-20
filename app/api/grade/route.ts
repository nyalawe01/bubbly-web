// app/api/grade/route.ts
//
// AI-grades short/long exam answers. MCQs are graded client-side (compare to the
// correct option); this handles the open-ended ones by comparing the student's
// answer to the model answer + rubric and awarding partial marks with feedback.
import { NextResponse } from "next/server";
import { callModel, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { supabase, getUser } = await createSupabaseServerClient(request);
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // items: [{ id, question, answer, modelAnswer, rubric, marks }]
  const { items } = await request.json();
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ results: [] });

  const system = `You are a fair, encouraging exam grader. For EACH item, compare the student's answer to the
model answer and rubric, and award marks out of that item's maximum ("marks"). Partial credit is allowed.
Respond ONLY with JSON:
{ "results": [ { "id": string, "marks": number, "feedback": string } ] }
- "marks": a number from 0 to the item's max (may be a decimal for partial credit).
- "feedback": one or two sentences on what was right and what was missing. If the answer is empty, award 0 and say what a good answer would include.`;

  try {
    // generatorPrecise: a disputed exam grade is a trust failure, not a quality nit.
    const response = await callModel(MODELS.generatorPrecise, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ items }) },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{"results":[]}');
    return NextResponse.json({ results: parsed.results || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Grading failed", results: [] }, { status: 500 });
  }
}
