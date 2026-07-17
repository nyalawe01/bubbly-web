"use client";
import { useMemo, useState } from "react";
import { BrainCircuit, MonitorPlay, ImageIcon, FileText, Loader2, AlertCircle } from "lucide-react";
import { RowMenu } from "@/components/ui/RowMenu";

interface NotebooksProps {
  // Supabase notebook_assets rows: { id, type, title, status, content, pinned }
  assets: any[];
  onOpenAsset: (asset: any) => void;
  onPin: (asset: any) => void;
  onRename: (asset: any, title: string) => void;
  onDelete: (asset: any) => void;
  onShare: (asset: any) => void;
  colors: any;
}

const ICONS: Record<string, any> = {
  quiz: BrainCircuit,
  exam: BrainCircuit,
  slides: MonitorPlay,
  flashcards: ImageIcon,
};

const COLORS: Record<string, string> = {
  quiz: "bg-indigo-500/10 text-indigo-400",
  exam: "bg-rose-500/10 text-rose-400",
  slides: "bg-fuchsia-500/10 text-fuchsia-400",
  flashcards: "bg-amber-500/10 text-amber-400",
};

// A one-line subtitle derived from the generated content (no extra DB column).
function subtitle(a: any): string {
  const c = a.content;
  if (a.status === "generating") return "Generating…";
  if (a.status === "failed") return "Failed — tap to dismiss";
  if (!c) return a.type;
  if (a.type === "quiz") return `${c.questions?.length ?? "?"} questions`;
  if (a.type === "flashcards") return `${c.cards?.length ?? "?"} cards`;
  if (a.type === "slides") return `${c.slides?.length ?? "?"} slides`;
  if (a.type === "exam") return `${c.totalMarks ?? "?"} marks`;
  return a.type === "guide" ? "Study guide" : "Summary";
}

export function Notebooks({ assets, onOpenAsset, onPin, onRename, onDelete, onShare, colors }: NotebooksProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  // Pinned first, otherwise keep the incoming (newest-first) order.
  const ordered = useMemo(() => [...assets].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)), [assets]);

  if (!ordered.length) {
    return <div className={`px-3 py-2 text-[13px] ${colors.textSecondary}`}>No assets generated yet.</div>;
  }

  const startRename = (asset: any) => {
    setRenamingId(asset.id);
    setDraftTitle(asset.title || "");
  };
  const commitRename = (asset: any) => {
    onRename(asset, draftTitle);
    setRenamingId(null);
  };

  return (
    <div className="space-y-1">
      {ordered.map((asset) => {
        const Icon = ICONS[asset.type] || FileText;
        const generating = asset.status === "generating";
        const failed = asset.status === "failed";
        const isRenaming = renamingId === asset.id;
        return (
          <div key={asset.id} className={`group relative flex items-center gap-1 rounded-lg transition-colors ${colors.bgHover}`}>
            <button
              onClick={() => onOpenAsset(asset)}
              disabled={generating || isRenaming}
              className={`flex-1 min-w-0 text-left flex items-center gap-3 p-2.5 rounded-lg ${generating ? "opacity-70 cursor-default" : ""}`}
            >
              <div className={`p-2 rounded-md flex-shrink-0 ${COLORS[asset.type] || "bg-emerald-500/10 text-emerald-400"}`}>
                {generating ? <Loader2 size={16} className="animate-spin" /> : failed ? <AlertCircle size={16} className="text-red-500" /> : <Icon size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onBlur={() => commitRename(asset)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(asset);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full text-[15px] font-medium leading-snug bg-transparent outline-none ${colors.textPrimary}`}
                  />
                ) : (
                  <div className={`text-[15px] font-medium ${colors.textPrimary} truncate leading-snug`}>{asset.title}</div>
                )}
                <div className={`text-[12px] ${failed ? "text-red-500" : colors.textSecondary} truncate mt-0.5`}>{subtitle(asset)}</div>
              </div>
            </button>
            {!isRenaming && (
              <div className="pr-1">
                <RowMenu
                  pinned={!!asset.pinned}
                  onShare={() => onShare(asset)}
                  onTogglePin={() => onPin(asset)}
                  onRename={() => startRename(asset)}
                  onDelete={() => onDelete(asset)}
                  colors={colors}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
