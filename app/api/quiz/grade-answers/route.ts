// app/api/quiz/grade-answers/route.ts
//
// AI-grades quiz question types that can't be checked with a simple index
// comparison: "fill_blank" (a typed answer judged for meaning, not exact
// wording) and "listing" (several typed items checked against a pool of
// acceptable reference answers). Same batch shape as app/api/grade/route.ts
// (items[] in, results[] out) but its own prompt — binary correct/incorrect
// at a semantic-match threshold, and the student's answer may be written in
// a different language than the question was asked in.
import { NextResponse } from "next/server";
import { getClient, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { supabase, getUser } = await createSupabaseServerClient(request);
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // items: [
  //   { id, type: "fill_blank", question, answer, modelAnswer },
  //   { id, type: "listing", question, answers: string[], modelAnswers: string[] },
  // ]
  const { items } = await request.json();
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ results: [] });

  const system = `You are a fair, precise exam grader. For EACH item, decide if the student's answer is
CORRECT — judged by MEANING, never by exact wording. The student may answer in a completely different
language than the question was asked in (e.g. question in English, answer in Swahili or French, or a
mix) — translate mentally and grade by meaning, not surface text. Treat an answer as correct if it is
at least 85% semantically equivalent to the model answer (minor phrasing, spelling, or translation
differences don't count against it; missing or contradicting the core meaning does).

For "fill_blank" items: compare "answer" to "modelAnswer" as a single judgment.

For "listing" items: the student supplied several typed "answers" (in order given, may include blanks).
Match each typed answer against the "modelAnswers" pool by meaning — one typed answer can only match one
reference answer (no double-crediting the same reference twice, and no crediting a repeated/duplicate
student answer twice). Count how many of the student's answers matched a distinct reference answer.

Respond ONLY with JSON:
{ "results": [
  { "id": string, "correct": boolean, "score": number, "matchedCount": number|null, "feedback": string }
] }
- "score": 0-100 semantic-match confidence. "correct" is true iff score >= 85.
- "matchedCount": for "listing" items, how many distinct typed answers matched a reference answer
  (null for "fill_blank" items).
- "feedback": one short sentence on what was right or missing. If the answer is empty, score 0.`;

  try {
    const openai = getClient(MODELS.generator.provider);
    const response = await openai.chat.completions.create({
      model: MODELS.generator.model,
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
