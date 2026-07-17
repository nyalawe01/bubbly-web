// app/api/notebook/chat/route.ts
//
// Asset-level chat shown beside a generated asset (summary/slides/flashcards/quiz/
// exam). It can both answer questions about the asset AND edit it on request. It
// returns { reply, updatedContent } — when the student asked for a change,
// updatedContent is the full new content in the same schema; otherwise null.
import { NextResponse } from "next/server";
import { getClient, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const { getUser } = await createSupabaseServerClient(request);
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, content, history, message } = await request.json();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const system = `You help a student review and refine a generated ${type}. You can (a) answer questions about
it, and (b) EDIT it when asked ("make question 3 harder", "shorten slide 2", "add a flashcard about X").
Respond ONLY with JSON:
{ "reply": string, "updatedContent": object | null }
- "reply": a short, friendly message — what you changed, or your answer to their question.
- "updatedContent": if (and only if) the student asked to change the ${type}, the FULL updated content in
  the EXACT same JSON shape and keys as the current content, with only the requested change applied and
  everything else preserved. If they only asked a question, set it to null.
Never alter the schema/keys. Never invent fields.`;

  const messages = [
    { role: "system" as const, content: system },
    ...(Array.isArray(history) ? history : []).map((h: any) => ({
      role: h.role === "user" ? ("user" as const) : ("assistant" as const),
      content: h.text,
    })),
    {
      role: "user" as const,
      content: `CURRENT ${type} CONTENT (JSON):\n${JSON.stringify(content)}\n\nSTUDENT: ${message}`,
    },
  ];

  try {
    const openai = getClient(MODELS.generator.provider);
    const response = await openai.chat.completions.create({
      model: MODELS.generator.model,
      messages,
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return NextResponse.json({ reply: parsed.reply || "", updatedContent: parsed.updatedContent || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Chat failed" }, { status: 500 });
  }
}
