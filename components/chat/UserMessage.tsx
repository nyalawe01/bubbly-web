"use client";
import { useState } from "react";
import { Paperclip, ChevronDown, ChevronUp, Copy, Check, Pencil, X } from "lucide-react";
import { FilePreviewModal, type PreviewableFile } from "@/components/ui/FilePreviewModal";

interface UserMessageProps {
  message: any;
  onFileClick?: (file: any) => void; // optional now — kept for backward compat (analytics etc.), preview works standalone
  onEdit?: (newText: string) => void; // resends the edited text, discarding everything after this message
  colors: any;
}

export function UserMessage({ message, onEdit, colors }: UserMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const MAX_CHARS = 150;
  const MAX_LINES = 3;

  const text = message.text || "";
  const isLongText = text.length > MAX_CHARS || text.split('\n').length > MAX_LINES;

  const displayText = isLongText && !isExpanded
    ? text.slice(0, MAX_CHARS) + (text.length > MAX_CHARS ? '...' : '')
    : text;

  // Opens the drawer preview directly. Previously it ALSO fired the page's legacy
  // onFileClick (which opened a second, content-less doc modal behind it) — the
  // standalone preview already renders the real file content, so that's dropped.
  const handleFileClick = (file: any) => {
    setPreviewFile({ name: file.name, type: file.type, size: file.size, url: file.url, raw: file.raw || (file instanceof File ? file : undefined) });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startEdit = () => {
    setDraft(text);
    setEditing(true);
  };

  const submitEdit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== text) onEdit?.(trimmed);
  };

  return (
    // Wider than before, and grows to the LEFT (right edge stays anchored by the
    // outer justify-end wrapper). Copy/Edit sit bottom-right, under the bubble,
    // invisible until the bubble/row is hovered — group-hover, no layout shift.
    <div className="group flex flex-col items-end max-w-[88%] md:max-w-[78%]">
      <div
        className={`w-full rounded-xl p-3 md:p-3 text-[15px] md:text-[14px] ${colors.bgInput} whitespace-pre-wrap border ${colors.borderBase} shadow-sm`}
      >
        {message.files && message.files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5 md:gap-2">
            {message.files.map((file: any, idx: number) => (
              <button
                key={idx}
                onClick={() => handleFileClick(file)}
                className={`icon-motion px-2 md:px-2.5 py-1 ${colors.bgCard} border ${colors.borderBase} rounded-lg text-[9px] md:text-[11px] flex items-center gap-1 md:gap-1.5 hover:${colors.bgHover} transition-colors`}
              >
                <Paperclip size={9} className="md:w-[11px] md:h-[11px]" />
                {file.name}
              </button>
            ))}
          </div>
        )}

        {editing ? (
          <div>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                if (e.key === "Escape") setEditing(false);
              }}
              rows={Math.min(8, Math.max(2, draft.split("\n").length))}
              className={`w-full bg-transparent outline-none resize-none ${colors.textPrimary}`}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => setEditing(false)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${colors.textSecondary} hover:${colors.bgHover}`}
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${colors.btnPrimary}`}
              >
                Save & submit
              </button>
            </div>
          </div>
        ) : (
          <div className="break-words">
            {displayText}
            {isLongText && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`ml-2 inline-flex items-center gap-0.5 text-[11px] font-medium ${colors.textSecondary} hover:${colors.textPrimary} transition-colors`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={12} /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} /> Show more
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-0.5 mt-0.5 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto">
          <button
            onClick={handleCopy}
            className={`p-1 rounded-lg ${colors.textSecondary} hover:${colors.bgHover} transition-colors`}
            aria-label="Copy"
            title="Copy"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
          {onEdit && (
            <button
              onClick={startEdit}
              className={`p-1 rounded-lg ${colors.textSecondary} hover:${colors.bgHover} transition-colors`}
              aria-label="Edit"
              title="Edit"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      )}

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
