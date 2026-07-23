"use client";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Share2, Download, Pin, PinOff, Pencil, Trash2 } from "lucide-react";

interface RowMenuProps {
  pinned?: boolean;
  onShare: () => void;
  onExport?: () => void;
  onTogglePin: () => void;
  onRename: () => void;
  onDelete: () => void;
  colors: any;
}

/** The three-dot row action menu shared by Recents (chats) and Notebooks (assets):
 *  Share / Pin-Unpin / Rename / Delete. The trigger is invisible by default and
 *  fades in via CSS `group-hover` — the PARENT row must have className="group" for
 *  that to work — and stays visible while its own dropdown is open so it doesn't
 *  vanish out from under the mouse mid-interaction. */
export function RowMenu({ pinned, onShare, onExport, onTogglePin, onRename, onDelete, colors }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const run = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    fn();
  };

  return (
    <div
      ref={ref}
      className={`relative flex-shrink-0 transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`p-1 rounded-md ${colors.bgHover} ${colors.textSecondary}`}
        aria-label="More options"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 top-full mt-1 w-40 ${colors.bgCard} border ${colors.borderBase} rounded-xl p-1 z-50 shadow-xl animate-in fade-in zoom-in-95 duration-100`}
        >
          <button onClick={run(onShare)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg ${colors.bgHover} ${colors.textPrimary}`}>
            <Share2 size={14} /> Share
          </button>
          {onExport && (
            <button onClick={run(onExport)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg ${colors.bgHover} ${colors.textPrimary}`}>
              <Download size={14} /> Export
            </button>
          )}
          <button onClick={run(onTogglePin)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg ${colors.bgHover} ${colors.textPrimary}`}>
            {pinned ? <PinOff size={14} /> : <Pin size={14} />} {pinned ? "Unpin" : "Pin"}
          </button>
          <button onClick={run(onRename)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg ${colors.bgHover} ${colors.textPrimary}`}>
            <Pencil size={14} /> Rename
          </button>
          <div className={`h-px w-full ${colors.bgInput} my-1`} />
          <button onClick={run(onDelete)} className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg text-red-500 hover:bg-red-500/10">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
