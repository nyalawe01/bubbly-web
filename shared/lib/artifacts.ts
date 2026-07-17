// lib/artifacts.ts
//
// Splits an AI response into inline prose and "artifacts" (substantial code,
// mermaid, svg, or long structured docs). Substantial fenced blocks become
// openable cards instead of walls of text pasted into the chat; short snippets
// stay inline. Pure, client-safe.

export type ArtifactKind = "code" | "mermaid" | "svg" | "markdown";

export interface Artifact {
  id: string;
  kind: ArtifactKind;
  title: string;
  lang?: string;
  content: string;
}

export type Segment = { type: "text"; text: string } | { type: "artifact"; artifact: Artifact };

const FENCE = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;

function classify(lang: string | undefined, body: string): { kind: ArtifactKind; substantial: boolean } {
  const l = (lang || "").toLowerCase();
  if (l === "mermaid") return { kind: "mermaid", substantial: true };
  if (l === "svg") return { kind: "svg", substantial: true };
  if (l === "doc" || l === "summary" || l === "markdown" || l === "md")
    return { kind: "markdown", substantial: true };
  const lines = body.split("\n").length;
  // Only pull code OUT of the flow when it's big enough to be worth a card.
  const substantial = lines >= 8 || body.length >= 400;
  return { kind: "code", substantial };
}

function titleFor(kind: ArtifactKind, lang: string | undefined): string {
  if (kind === "mermaid") return "Diagram";
  if (kind === "svg") return "Illustration";
  if (kind === "markdown") return "Document";
  return lang ? `${lang.toUpperCase()} snippet` : "Code";
}

export function extractArtifacts(text: string, msgId = "m"): { segments: Segment[]; artifacts: Artifact[] } {
  const segments: Segment[] = [];
  const artifacts: Artifact[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  FENCE.lastIndex = 0;

  while ((m = FENCE.exec(text)) !== null) {
    const [full, lang, bodyRaw] = m;
    const body = bodyRaw.replace(/\s+$/, "");
    const { kind, substantial } = classify(lang, body);
    if (!substantial) continue; // leave short fenced snippets inline

    if (m.index > last) segments.push({ type: "text", text: text.slice(last, m.index) });
    const artifact: Artifact = {
      id: `${msgId}-a${n++}`,
      kind,
      title: titleFor(kind, lang),
      lang,
      content: body,
    };
    artifacts.push(artifact);
    segments.push({ type: "artifact", artifact });
    last = m.index + full.length;
  }

  if (last < text.length) segments.push({ type: "text", text: text.slice(last) });
  if (segments.length === 0) segments.push({ type: "text", text });
  return { segments, artifacts };
}
