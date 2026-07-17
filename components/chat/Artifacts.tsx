"use client";
// components/chat/Artifacts.tsx
//
// Inline artifact CARD (shown in the chat flow) + the right-side reveal DRAWER
// that renders the artifact when the card is clicked. Lets the AI emit a short
// explanation + an openable card instead of dumping code/mermaid/svg/docs as
// walls of text.
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Code2, GitBranch, Image as ImageIcon, FileText, X, Copy, Check } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { IconChip } from "@/components/ui/IconChip";
import { DiagramViewer } from "@/components/DiagramViewer";
import type { Artifact, ArtifactKind } from "@/lib/artifacts";

const KIND_ICON: Record<ArtifactKind, any> = {
  code: Code2,
  mermaid: GitBranch,
  svg: ImageIcon,
  markdown: FileText,
};

export function ArtifactCard({ artifact, onOpen }: { artifact: Artifact; onOpen: () => void }) {
  const Icon = KIND_ICON[artifact.kind];
  const lines = artifact.content.split("\n").length;
  return (
    <button
      onClick={onOpen}
      className="icon-lift my-2 w-full max-w-md flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-left shadow-sm"
    >
      <IconChip icon={Icon} size={18} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{artifact.title}</p>
        <p className="text-xs text-[var(--text-secondary)]">
          {artifact.kind === "code" ? `${lines} lines · tap to open` : "Tap to open"}
        </p>
      </div>
    </button>
  );
}

export function ArtifactDrawer({ artifact, onClose }: { artifact: Artifact; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const Icon = KIND_ICON[artifact.kind];

  const copy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="drawer-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-panel relative h-full w-full max-w-2xl bg-[var(--bg-card)] border-l border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <IconChip icon={Icon} size={16} />
            <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">{artifact.title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <IconButton icon={copied ? Check : Copy} label={copied ? "Copied" : "Copy"} onClick={copy} />
            <IconButton icon={X} label="Close" onClick={onClose} />
          </div>
        </div>

        <div className="flex-1 overflow-auto panel-scroll p-4 md:p-6">
          {artifact.kind === "mermaid" ? (
            <DiagramViewer diagram={{ mermaid: artifact.content, type: "mermaid" }} />
          ) : artifact.kind === "svg" ? (
            <div
              className="flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: artifact.content }}
            />
          ) : artifact.kind === "markdown" ? (
            <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert ai-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {artifact.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {`\`\`\`${artifact.lang || ""}\n${artifact.content}\n\`\`\``}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
