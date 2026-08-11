"use client";
// components/modals/FilePreviewModal.tsx (exports DocPreviewModal)
//
// Distinct from components/ui/FilePreviewModal.tsx, which previously shared
// this exact component name — that one previews raw browser Files/remote URLs
// (ChatInput/UserMessage attachments); this one previews already-extracted
// text content (vault documents / attached-file click-through from chat),
// which don't have a fetchable `url` to hand to the generic viewer.
import { X, Download, Sparkles, FileText } from "lucide-react";

interface DocPreviewModalProps {
  open: boolean;
  onClose: () => void;
  file: any;
  colors: any;
  // Layering override for callers that render this nested inside another modal
  // (e.g. VaultSourcePicker inside Quiz/Flashcards/... which are all z-50 too).
  zClassName?: string;
}

export function FilePreviewModal({ open, onClose, file, colors, zClassName = "z-50" }: DocPreviewModalProps) {
  if (!open || !file) return null;

  const handleDownload = () => {
    const blob = new Blob([file.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name || "document.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm ${zClassName} flex items-center justify-center p-3 md:p-4`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-zinc-500/10 text-zinc-500 rounded-lg shrink-0">
              <FileText size={16} className="md:w-[18px] md:h-[18px]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium truncate text-[var(--text-primary)]">
                {file.name}
              </h3>
              <p className="text-[10px] md:text-xs text-[var(--text-secondary)]">Document Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={handleDownload}
              className="icon-motion p-1.5 md:p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full"
            >
              <Download size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
            <button
              onClick={onClose}
              className="icon-motion p-1.5 md:p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full"
            >
              <X size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[var(--background)] overflow-y-auto hide-scrollbar p-4 md:p-8">
          <div className="bg-[var(--bg-card)] rounded-xl p-4 md:p-8 shadow-sm border border-[var(--border)]">
            <pre className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed font-sans text-neutral-800 dark:text-neutral-200">
              {file.content || "No content available"}
            </pre>
          </div>
        </div>

        {file.aiSummary && (
          <div className="p-3 md:p-4 border-t border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="p-1.5 bg-zinc-500/10 rounded-lg mt-0.5 shrink-0">
                <Sparkles size={14} className="text-[var(--text-secondary)]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs font-medium text-[var(--text-secondary)] mb-1">AI Summary</p>
                <p className="text-xs md:text-sm leading-relaxed text-[var(--text-secondary)]">
                  {file.aiSummary}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
