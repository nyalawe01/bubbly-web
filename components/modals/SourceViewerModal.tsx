"use client";
import { X, Globe, FileText, ExternalLink } from "lucide-react";

interface SourceViewerModalProps {
  open: boolean;
  onClose: () => void;
  sources: any[];
  colors: any;
}

export function SourceViewerModal({ open, onClose, sources, colors }: SourceViewerModalProps) {
  if (!open || !sources || sources.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[80vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className={`flex items-center justify-between p-4 md:p-5 border-b border-[var(--border)]`}>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sources</h3>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 hide-scrollbar space-y-3">
          {sources.map((source, idx) => (
            <div key={idx} className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {source.type === 'web' ? <Globe size={16} className="text-blue-500" /> : <FileText size={16} className="text-[var(--text-secondary)]" />}
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">{source.title || 'Untitled Source'}</span>
                </div>
                {source.url && (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                    <ExternalLink size={14} className="text-[var(--text-secondary)]" />
                  </a>
                )}
              </div>
              {source.snippet && (
                <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2">{source.snippet}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}