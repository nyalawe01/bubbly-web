import { callModel, chatModelFor } from "@/lib/ai/models";

export async function generateDiagram(text: string, diagramType: string = "flowchart") {
  const prompt = `
Convert the following text into a structured ${diagramType} diagram.
Identify key entities (nodes), relationships (edges), and labels.

Return a JSON object with this exact schema:
{
  "title": "Diagram Title",
  "diagram_type": "${diagramType}",
  "nodes": [
    { "id": "n1", "type": "rectangle", "label": "Node Label", "x": 100, "y": 100 }
  ],
  "edges": [
    { "from": "n1", "to": "n2", "label": "Edge Label" }
  ]
}

Text to visualize:
"${text}"
`;

  try {
    const chatModel = chatModelFor("expert");
    const rawOutput: any = await callModel(chatModel, {
      messages: [{ role: "system", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    
    const diagram = typeof rawOutput === "string" ? JSON.parse(rawOutput) : rawOutput;
    
    // Add default layout coordinates if not provided perfectly
    let xOffset = 100;
    diagram.nodes?.forEach((n: any) => {
      if (!n.x) { n.x = xOffset; xOffset += 200; }
      if (!n.y) { n.y = 100; }
    });

    return diagram;
  } catch (err) {
    console.error("Failed to generate diagram:", err);
    throw err;
  }
}
