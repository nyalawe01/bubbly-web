// app/api/notebook/qchat/route.ts
//
// Per-question tutoring chat for a quiz/exam question. Uses the fast chat model.
// The reply is returned to the client, which saves it inside the asset's state
// (state.qchats[questionId]) — it deliberately never touches the global chat
// history.
import { NextResponse } from "next/server";
import { getClient, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  const { getUser } = await createSupabaseServerClient(request);
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, options, correctAnswer, studentAnswer, explanation, history, message } = await request.json();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const system = `${CHAT_SYSTEM_PROMPT}

You are helping the student understand ONE specific question they just answered in a quiz or exam. Use the
answer key below to explain clearly, give examples, or clarify whatever they ask — stay focused on THIS
question. Don't mention other questions.

QUESTION: ${question}
${options?.length ? `OPTIONS: ${options.map((o: string, i: number) => `${String.fromCharCode(65 + i)}. ${o}`).join("  ")}` : ""}
CORRECT ANSWER: ${correctAnswer ?? "(see explanation)"}
STUDENT'S ANSWER: ${studentAnswer ?? "(not answered)"}
${explanation ? `EXPLANATION: ${explanation}` : ""}`;

  const messages = [
    { role: "system" as const, content: system },
    ...(Array.isArray(history) ? history : []).map((h: any) => ({
      role: h.role === "user" ? ("user" as const) : ("assistant" as const),
      content: h.text,
    })),
    { role: "user" as const, content: message },
  ];

  try {
    const tier = MODELS.chatFast;
    const openai = getClient(tier.provider);
    const response = await openai.chat.completions.create({
      model: tier.model,
      messages,
      temperature: 0.5,
      max_tokens: 900,
    });
    return NextResponse.json({ reply: response.choices[0]?.message?.content || "" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Chat failed" }, { status: 500 });
  }
}
