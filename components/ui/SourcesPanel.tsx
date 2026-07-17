"use client";
// components/ui/SourcesPanel.tsx
//
// Right-side slide-in drawer for web search sources — the pattern Perplexity
// and NotebookLM both use: a compact row of source "chips" sits inline with
// the response, and clicking one (or "view all") opens this full drawer with
// snippets and outbound links, without navigating away from the chat.

import { useEffect } from "react";
import { X, ExternalLink, Globe } from "lucide-react";
import { IconButton } from "./IconButton";

export interface Source {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
}

interface SourcesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
}

function faviconFor(url: string) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

export function SourcesPanel({ isOpen, onClose, sources }: SourcesPanelProps) {
  // ESC to close — standard drawer/modal behavior users expect.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div
        className="drawer-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="drawer-panel relative w-full sm:w-[420px] h-full bg-[#121214] border-l border-white/10 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Sources</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">{sources.length} result{sources.length !== 1 ? 's' : ''} from the web</p>
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto panel-scroll px-4 py-4 space-y-3">
          {sources.map((source, i) => {
            const favicon = faviconFor(source.url);
            return (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3.5 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5">
                    {favicon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={favicon} alt="" className="w-4 h-4" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <Globe size={14} className="text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500 truncate">
                        {source.domain || new URL(source.url).hostname}
                      </span>
                      <span className="text-[9px] text-zinc-600 flex-shrink-0">· {i + 1}</span>
                    </div>
                    <h3 className="text-[13px] font-medium text-zinc-100 mt-0.5 line-clamp-2 group-hover:text-white">
                      {source.title}
                    </h3>
                    {source.snippet && (
                      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {source.snippet}
                      </p>
                    )}
                  </div>
                  <ExternalLink size={13} className="text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Compact horizontal chip row shown inline above an AI response — the
 *  "sources at the beginning of the chat" the student sees before reading
 *  the answer. Clicking any chip (or "+N more") opens the full SourcesPanel. */
export function SourcesRow({ sources, onOpenAll }: { sources: Source[]; onOpenAll: () => void }) {
  if (!sources.length) return null;
  const visible = sources.slice(0, 3);
  const remaining = sources.length - visible.length;

  return (
    <div className="source-chip-row flex items-center gap-2 mb-3 overflow-x-auto hide-scrollbar pb-1">
      {visible.map((source, i) => {
        const favicon = faviconFor(source.url);
        return (
          <button
            key={i}
            onClick={onOpenAll}
            className="source-chip icon-motion flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={favicon} alt="" className="w-2.5 h-2.5" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <Globe size={8} className="text-zinc-500" />
              )}
            </div>
            <span className="text-[10px] text-zinc-400 max-w-[90px] truncate">
              {source.domain || (() => { try { return new URL(source.url).hostname; } catch { return source.title; } })()}
            </span>
          </button>
        );
      })}
      {remaining > 0 && (
        <button
          onClick={onOpenAll}
          className="source-chip icon-motion flex-shrink-0 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] text-zinc-400 transition-colors"
        >
          +{remaining} more
        </button>
      )}
    </div>
  );
}