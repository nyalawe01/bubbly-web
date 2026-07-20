// app/api/agent/classify/route.ts
//
// Fast, cheap, text-only gate for the extension's page-action agent: is this
// message asking bubbly to DO something on the attached tab, or just asking
// about it? Deliberately separate from app/api/agent/plan (which needs the
// page's interactive elements, a nontrivial DOM-extraction step) so that
// cost only gets paid for messages that actually need it. Same
// callModel(MODELS.router, ...) pattern as lib/ai/router.ts's
// classifyIntent — modeled on it directly, kept as its own isolated route
// rather than folded into /api/chat to avoid touching that already-complex,
// heavily shared streaming pipeline.
import { NextResponse } from "next/server";
import { callModel, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PAGE_ACTION_ROUTER_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const { getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const response = await callModel(MODELS.router, {
      messages: [
        { role: "system", content: PAGE_ACTION_ROUTER_PROMPT },
        { role: "user", content: String(message).slice(0, 2000) },
      ],
      // 100, not 30: GPT-OSS reasons on every call even at reasoning_effort "low"
      // (can't be fully disabled), and that reasoning eats into max_tokens before
      // the JSON answer — 30 was too tight and 400'd ("Failed to generate JSON").
      max_tokens: 100,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return NextResponse.json({ isAction: !!parsed.isAction });
  } catch (error: any) {
    // Fail closed — same posture as classifyIntent: if classification breaks,
    // default to "not an action" rather than risking a surprise action preview.
    console.warn("Page-action classification failed, defaulting to false:", error);
    return NextResponse.json({ isAction: false });
  }
}
