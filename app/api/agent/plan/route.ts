// app/api/agent/plan/route.ts
//
// Given the student's instruction and a simplified list of the attached
// tab's interactive elements (see extension/lib/extractInteractive.ts),
// returns a bounded sequence of actions (type/click/select/check/uncheck/
// scrollTo) referencing those elements by id. This is a proposal only — the
// extension shows it to the student for approval before anything executes;
// nothing here touches a page directly. Modeled on app/api/summary/route.ts's
// callModel(MODELS.generator, ...) + JSON response_format pattern.
import { NextResponse } from "next/server";
import { callModel, MODELS } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PAGE_ACTION_PLAN_PROMPT } from "@/lib/ai/prompts";

const VALID_TYPES = new Set(["type", "click", "select", "check", "uncheck", "scrollTo"]);

export async function POST(request: Request) {
  try {
    const { instruction, elements } = await request.json();
    if (!instruction || !Array.isArray(elements)) {
      return NextResponse.json({ error: "instruction and elements are required" }, { status: 400 });
    }

    const { getUser } = await createSupabaseServerClient(request);
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const validIds = new Set(elements.map((el: any) => el.id));
    const response = await callModel(MODELS.generator, {
      messages: [
        { role: "system", content: PAGE_ACTION_PLAN_PROMPT },
        { role: "user", content: `Elements:\n${JSON.stringify(elements).slice(0, 12000)}\n\nInstruction: ${instruction}` },
      ],
      max_tokens: 1500,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    const rawActions = Array.isArray(parsed.actions) ? parsed.actions : [];

    // Defense in depth beyond the prompt: drop anything with an unknown
    // action type or an id the page extraction never actually produced —
    // the model can only ever reference real, currently-present elements.
    const actions = rawActions.filter((a: any) => VALID_TYPES.has(a?.type) && validIds.has(a?.id));

    return NextResponse.json({ actions });
  } catch (error: any) {
    console.error("Page-action planning failed:", error);
    return NextResponse.json({ error: error.message || "Planning failed", actions: [] }, { status: 500 });
  }
}
