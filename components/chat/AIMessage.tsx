"use client";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { RefreshCw, Share, ArrowRight, BrainCircuit, MonitorPlay, ImageIcon, ClipboardList, CheckCircle2, ChevronRight, LayoutTemplate } from "lucide-react";
import { AnimatedCopyIcon } from "@/components/ui/icons";
import { DiagramViewer } from "@/components/DiagramViewer";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { IconButton } from "@/components/ui/IconButton";
import { SourceViewerModal } from "@/components/modals/SourceViewerModal";
import { extractArtifacts, type Artifact } from "@/lib/artifacts";
import { ArtifactCard, ArtifactDrawer } from "@/components/chat/Artifacts";

interface AIMessageProps {
  message: any;
  isGenerating: boolean;
  onRegenerate: () => void;
  onShare: (text: string) => void;
  onOpenSourceViewer?: (sources: any[]) => void; // kept optional for backward compat; panel now works standalone
  onOpenAsset: (asset: any) => void;
  questionsAnswered?: boolean;
  onOpenQuestions?: () => void;
  colors: any;
  theme: string;
}

export function AIMessage({
  message,
  isGenerating,
  onRegenerate,
  onShare,
  onOpenSourceViewer,
  onOpenAsset,
  questionsAnswered,
  onOpenQuestions,
  colors,
  theme,
}: AIMessageProps) {
  const [sourceViewerOpen, setSourceViewerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openArtifact, setOpenArtifact] = useState<Artifact | null>(null);

  // Pull substantial code / mermaid / svg / doc blocks out of the prose into
  // openable cards; short snippets stay inline. Skip while still streaming so a
  // half-written fence doesn't flicker in and out.
  const { segments } = useMemo(
    () => (isGenerating ? { segments: [{ type: "text" as const, text: message.text || "" }] } : extractArtifacts(message.text || "", message.id || "m")),
    [message.text, message.id, isGenerating]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openSources = () => {
    setSourceViewerOpen(true);
    onOpenSourceViewer?.(message.sources); // fires legacy callback too, if the page still wires one
  };

  // Heuristic to detect visualizable concepts in text
  const isVisualizable = useMemo(() => {
    if (!message.text || isGenerating) return false;
    const t = message.text.toLowerCase();
    return (
      (t.includes("first") && t.includes("then") && t.includes("next")) ||
      (t.includes("process") && t.includes("step")) ||
      (t.includes("compared to") && t.includes("difference")) ||
      (t.includes("cycle") && t.includes("loop"))
    );
  }, [message.text, isGenerating]);

  const handleGenerateDiagram = async () => {
    // In a real app, this would call an API or change chat state
    alert("Generating visual explanation (Mock)...");
  };

  return (
    <div className="w-full flex items-start gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="flex-1 min-w-0">
        <div className={`mt-1 ${theme === "dark" ? "" : ""}`}>
          {segments.map((seg, i) =>
            seg.type === "artifact" ? (
              <ArtifactCard key={i} artifact={seg.artifact} onOpen={() => setOpenArtifact(seg.artifact)} />
            ) : (
              <div
                key={i}
                className={`prose prose-base md:prose-base max-w-none leading-relaxed ai-prose ${
                  theme === "dark" ? "dark:prose-invert prose-zinc" : "prose-zinc"
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Separate sections with whitespace, not rules.
                    hr: () => <div className="h-4" aria-hidden="true" />,
                  }}
                >
                  {seg.text}
                </ReactMarkdown>
              </div>
            )
          )}
        </div>

        {openArtifact && <ArtifactDrawer artifact={openArtifact} onClose={() => setOpenArtifact(null)} />}

        {/* MENTOR MODE form: a pending question set the student can open, or a done marker. */}
        {message.questions?.questions?.length > 0 &&
          (questionsAnswered ? (
            <div className={`mt-2.5 inline-flex items-center gap-1.5 text-[11px] ${colors.textSecondary}`}>
              <CheckCircle2 size={13} className="text-emerald-500" />
              Answers submitted
            </div>
          ) : (
            <button
              onClick={onOpenQuestions}
              className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border ${colors.borderBase} ${colors.bgCard} ${colors.bgHover} shadow-sm text-[12px] font-medium transition-all hover:-translate-y-0.5`}
            >
              <ClipboardList size={14} />
              Answer a few questions
            </button>
          ))}

        {message.diagram && (
          <div className="mt-3">
            <DiagramViewer diagram={message.diagram} />
          </div>
        )}

        {message.image && (
          <div className="mt-3">
            <ImageViewer image={message.image} />
          </div>
        )}

        {message.asset && (
          <div
            onClick={() => onOpenAsset(message.asset)}
            className={`mt-3 p-2.5 md:p-3 rounded-xl border ${colors.borderBase} ${colors.bgCard} ${colors.bgHover} cursor-pointer flex items-center justify-between shadow-sm transition-all hover:-translate-y-0.5 group`}
          >
            <div className="flex items-center gap-2.5 md:gap-3">
              <div className={`p-1.5 md:p-2 rounded-lg bg-zinc-500/10`}>
                {message.asset.type === "quiz" ? (
                  <BrainCircuit size={16} className="md:w-[20px] md:h-[20px] text-zinc-500" />
                ) : message.asset.type === "slides" ? (
                  <MonitorPlay size={16} className="md:w-[20px] md:h-[20px] text-zinc-500" />
                ) : (
                  <ImageIcon size={16} className="md:w-[20px] md:h-[20px] text-zinc-500" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-[13px] md:text-[14px]">{message.asset.title}</h4>
                <p className={`text-[9px] md:text-[11px] ${colors.textSecondary} mt-0.5`}>
                  {message.asset.metadata}
                </p>
              </div>
            </div>
            <div
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full ${colors.bgInput} flex items-center justify-center group-hover:bg-zinc-800 group-hover:text-white dark:group-hover:bg-zinc-200 dark:group-hover:text-black transition-colors`}
            >
              <ArrowRight size={13} className="md:w-[14px] md:h-[14px]" />
            </div>
          </div>
        )}

        {/* Sources — one line at the bottom of the response, only once it has
            finished (avoids the link appearing before the list is complete). */}
        {!isGenerating && message.sources && message.sources.length > 0 && (
          <button
            onClick={openSources}
            className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium ${colors.textSecondary} hover:${colors.textPrimary} transition-colors`}
          >
            Referenced from {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
            <ChevronRight size={11} />
          </button>
        )}

        {!isGenerating && isVisualizable && !message.diagram && (
          <div className="mt-3">
            <button
              onClick={handleGenerateDiagram}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border ${colors.borderBase} ${colors.bgCard} ${colors.bgHover} shadow-sm text-[12px] font-medium transition-all hover:-translate-y-0.5 text-indigo-600`}
            >
              <LayoutTemplate size={14} />
              Explain Visually
            </button>
          </div>
        )}

        {!isGenerating && message.text && (
          <div className={`flex flex-wrap items-center gap-1 mt-2.5 pt-2.5 border-t ${colors.borderBase}`}>
            <IconButton
              icon={AnimatedCopyIcon}
              iconProps={{ copied }}
              label={copied ? "Copied" : "Copy"}
              showLabel
              size="sm"
              onClick={handleCopy}
              className={copied ? "text-emerald-400" : ""}
            />
            <IconButton icon={RefreshCw} label="Regenerate" showLabel size="sm" onClick={onRegenerate} />
            <IconButton icon={Share} label="Share" showLabel size="sm" onClick={() => onShare(message.text)} />
          </div>
        )}
      </div>

      <SourceViewerModal
        open={sourceViewerOpen}
        onClose={() => setSourceViewerOpen(false)}
        sources={message.sources || []}
        colors={colors}
      />
    </div>
  );
}