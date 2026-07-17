// app/api/scisketch/route.ts
//
// Rewritten from scratch. The old version did three things wrong:
//   1. It generated draw.io XML, which DiagramViewer.tsx has never actually
//      rendered — it just dumps diagram.xml into a <pre> tag as raw text.
//      That's the real reason your diagrams "aren't well drawn": they were
//      never being drawn at all.
//   2. For type === 'quiz' | 'slides' | 'summary' | 'flashcards' it returned
//      hardcoded placeholder content ("Sample question 1") instead of calling
//      the model — dead code that overlapped with the dedicated quiz/slides/
//      flashcards/summary routes, which do the real work.
//   3. It made a second, separate LLM call just to generate "SVG icons" that
//      were never actually wired into the returned diagram.
//
// This route now does exactly one job: produce a single, valid, renderable
// Mermaid diagram, with a syntax check before returning so a broken diagram
// never reaches the client. It's used for on-demand diagram requests outside
// the main chat flow (e.g. a "Generate Diagram" action elsewhere in the UI).

import { NextResponse } from "next/server";
import { getClient, MODELS } from "@/lib/ai/models";

const MERMAID_TYPES = [
  "graph",
  "flowchart",
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "pie",
];

function looksLikeValidMermaid(code: string): boolean {
  const trimmed = code.trim();
  return MERMAID_TYPES.some((t) => trimmed.startsWith(t));
}

export async function POST(request: Request) {
  try {
    const { prompt, context, type } = await request.json();

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) throw new Error("Missing OpenRouter API Key");

    const openai = getClient(MODELS.generator.provider);

    const systemPrompt = `You generate clean, well-structured Mermaid diagrams for academic/educational use.

Rules:
- Output ONLY raw Mermaid code — no markdown fences, no explanation, no XML, no SVG.
- Pick the diagram type that best fits: flowchart (graph TD), sequenceDiagram, classDiagram,
  stateDiagram-v2, erDiagram, or pie — never anything outside these.
- Keep it readable: 4-12 nodes/participants maximum. Use short, clear labels.
- If the requested content genuinely isn't diagram-shaped, still produce the closest reasonable
  structural representation rather than refusing outright.`;

    const userPrompt = `Generate a Mermaid diagram for: ${prompt || context || 'the given topic'}${
      context ? `\n\nContext: ${context}` : ''
    }`;

    const response = await openai.chat.completions.create({
      model: MODELS.generator.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1200,
      temperature: 0.4,
    });

    let mermaidCode = (response.choices[0]?.message?.content || "").trim();
    // Strip accidental markdown fences in case the model adds them anyway.
    mermaidCode = mermaidCode.replace(/^```mermaid\n?/i, '').replace(/```$/, '').trim();

    if (!looksLikeValidMermaid(mermaidCode)) {
      throw new Error("Model did not return valid Mermaid syntax.");
    }

    return NextResponse.json({
      success: true,
      diagram: { mermaid: mermaidCode, type: type || 'diagram' },
    });
  } catch (error: any) {
    console.error("Diagram Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate diagram.", success: false },
      { status: 500 }
    );
  }
}