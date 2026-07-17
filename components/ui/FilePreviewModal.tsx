"use client";
// components/ui/FilePreviewModal.tsx
//
// One preview modal used in two places:
//  1. ChatInput — clicking a thumbnail BEFORE sending (raw browser File object)
//  2. UserMessage — clicking a file pill on an already-sent message
//     (a {name, url, type} descriptor from your backend/Supabase storage)
//
// Handles images, PDFs, and text-like files inline; falls back to a clean
// "no inline preview available" state with a download action for formats
// that genuinely can't be rendered in a modal (docx, pptx, xlsx, zip).

import { useEffect, useMemo, useState } from "react";
import { X, Download, FileText, File as FileIcon } from "lucide-react";
import { IconButton } from "./IconButton";

export interface PreviewableFile {
  name: string;
  type?: string;
  size?: number;
  url?: string; // present for already-uploaded/sent files
  raw?: File; // present for pre-send local files
}

interface FilePreviewModalProps {
  file: PreviewableFile | null;
  isOpen: boolean;
  onClose: () => void;
}

const TEXT_EXTENSIONS = ["txt", "md", "csv", "json", "js", "ts", "tsx", "html", "css", "svg"];

function getExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  const ext = file ? getExtension(file.name) : "";
  const isImage = file?.type?.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
  const isPdf = file?.type === "application/pdf" || ext === "pdf";
  const isText = TEXT_EXTENSIONS.includes(ext);

  // Resolve an actual displayable URL for both raw Files and remote files.
  const objectUrl = useMemo(() => {
    if (!file) return null;
    if (file.raw) return URL.createObjectURL(file.raw);
    return file.url || null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrl && file?.raw) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl, file]);

  useEffect(() => {
    if (!isOpen || !file || !isText) {
      setTextContent(null);
      return;
    }
    setLoadingText(true);
    (async () => {
      try {
        const text = file.raw ? await file.raw.text() : file.url ? await (await fetch(file.url)).text() : "";
        setTextContent(text.slice(0, 20000)); // cap for very large files
      } catch {
        setTextContent(null);
      } finally {
        setLoadingText(false);
      }
    })();
  }, [isOpen, file, isText]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="drawer-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Reveals from the right edge as a preview drawer. */}
      <div className="drawer-panel relative h-full w-full max-w-xl bg-[var(--bg-card)] border-l border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <FileText size={14} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</h3>
              {file.size && <p className="text-[10px] text-[var(--text-secondary)]">{formatBytes(file.size)}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {objectUrl && (
              <a href={objectUrl} download={file.name}>
                <IconButton icon={Download} label="Download" />
              </a>
            )}
            <IconButton icon={X} label="Close" onClick={onClose} />
          </div>
        </div>

        <div className="flex-1 overflow-auto panel-scroll bg-[var(--background)] flex items-center justify-center p-4 md:p-6">
          {isImage && objectUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={objectUrl} alt={file.name} className="max-w-full max-h-[65vh] object-contain rounded-lg" />
          ) : isPdf && objectUrl ? (
            <iframe src={objectUrl} className="w-full h-[65vh] rounded-lg bg-white" title={file.name} />
          ) : isText ? (
            loadingText ? (
              <div className="text-zinc-500 text-sm">Loading preview…</div>
            ) : (
              <pre className="w-full text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                {textContent || "No preview available."}
              </pre>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                <FileIcon size={24} className="text-zinc-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium">No inline preview available</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {ext.toUpperCase()} files can't be previewed here — download to view.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}