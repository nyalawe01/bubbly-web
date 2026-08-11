"use client";
import { X, Globe, FileText, ExternalLink, Paperclip } from "lucide-react";

interface SourceViewerModalProps {
  open: boolean;
  onClose: () => void;
  sources: any[];
  colors: any;
}

export function SourceViewerModal({ open, onClose, sources, colors }: SourceViewerModalProps) {
  if (!open || !sources || sources.length === 0) return null;

  const vaultSources = sources.filter((s) => s.type === "file" || s.type === "vault");
  const attachmentSources = sources.filter((s) => s.type === "attachment");
  const webSources = sources.filter((s) => s.type === "web");

  const Section = ({ label, icon, list }: { label: string; icon: React.ReactNode; list: any[] }) =>
    !list.length ? null : (
      <div className="mb-4 last:mb-0">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</h4>
        </div>
        {list.map((source, idx) => (
          <div key={idx} className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl mb-2 last:mb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {source.type === "web" ? (
                  <Globe size={14} className="text-blue-400" />
                ) : source.type === "attachment" ? (
                  <Paperclip size={14} className="text-[var(--accent)]" />
                ) : (
                  <FileText size={14} className="text-zinc-400" />
                )}
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {source.title || "Untitled Source"}
                </span>
              </div>
              {source.url && (
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                  <ExternalLink size={13} className="text-[var(--text-secondary)]" />
                </a>
              )}
            </div>
            {source.snippet && (
              <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{source.snippet}</p>
            )}
            {source.type === "attachment" && (
              <p className="text-[10px] text-zinc-500 mt-1.5">Attached file used as context for this message</p>
            )}
          </div>
        ))}
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] flex items-center justify-center p-3 md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[80vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className={`flex items-center justify-between p-4 md:p-5 border-b border-[var(--border)]`}>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sources</h3>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-5 hide-scrollbar">
          <Section label="Study Vault" icon={<FileText size={16} className="text-zinc-400" />} list={vaultSources} />
          <Section label="Attached Files" icon={<Paperclip size={16} className="text-[var(--accent)]" />} list={attachmentSources} />
          <Section label="Web Results" icon={<Globe size={16} className="text-blue-400" />} list={webSources} />
        </div>
      </div>
    </div>
  );
}
