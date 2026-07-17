// app/api/chat/title/route.ts
//
// Generates a short, accurate chat title from the student's first message —
// instead of just truncating their raw text. Runs on the fast/cheap router tier
// (Groq 8b-instant) since this is a tiny classification-shaped task, not a real
// chat turn. Called fire-and-forget right after a new chat is created, so it never
// blocks the message from sending.
import { NextResponse } from "next/server";
import { getClient, MODELS } from "@/lib/ai/models";

const TITLE_SYSTEM_PROMPT = `Read the student's message and write a short chat title that captures what they
actually want help with — simplified and accurate, not a copy of their wording.

Rules:
- 3-6 words. Sentence case (capitalize only the first word and proper nouns).
- Describe the underlying need/topic, not a restatement of their exact phrasing.
  Example: "how can I send files to cpanel my files are html and css" ->
  "Uploading files to cPanel" (not "Sending files to cpanel").
- No quotes, no trailing punctuation, no emoji.
- If the message is too short/vague to summarize (e.g. "hi"), just clean it up briefly (e.g. "Quick greeting").
Respond with ONLY the title text, nothing else.`;

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const client = getClient(MODELS.router.provider);
    const response = await client.chat.completions.create({
      model: MODELS.router.model,
      messages: [
        { role: "system", content: TITLE_SYSTEM_PROMPT },
        { role: "user", content: String(message).slice(0, 2000) },
      ],
      max_tokens: 30,
      temperature: 0.3,
    });

    const title = (response.choices[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ title: title || null });
  } catch (error: any) {
    // Non-fatal by design — the caller already has a fallback (truncated) title.
    return NextResponse.json({ title: null, error: error.message }, { status: 200 });
  }
}
