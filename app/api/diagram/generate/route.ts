import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { callModel, chatModelFor } from "@/lib/ai/models";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const chatModel = chatModelFor("expert");
    
    const systemPrompt = `
You are an expert technical diagrammer. The user will provide a concept or text.
You must generate a valid React Flow JSON representation of a flowchart explaining the concept.

Requirements:
- Return ONLY valid JSON, nothing else.
- Use nodes and edges.
- Each node must have: id, type (e.g., 'default', 'input', 'output'), position ({ x, y }), data ({ label: string }).
- Each edge must have: id, source (node id), target (node id), and optionally label (string), animated (boolean).
- Arrange the positions (x, y) logically so the flowchart is readable (e.g. top-down or left-to-right).

Return the JSON strictly matching this interface:
{
  "nodes": [
    { "id": "1", "type": "input", "position": { "x": 250, "y": 0 }, "data": { "label": "Start" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "animated": true }
  ]
}
`;

    const response = await callModel(chatModel, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    
    return NextResponse.json({ success: true, diagram: parsed });
  } catch (error: any) {
    console.error("Diagram generation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
