"use client";
import { useState } from "react";
import { X, Check } from "lucide-react";

interface SourcesModalProps {
  open: boolean;
  onClose: () => void;
  sources: string[];
  onConfirm: (selected: string[]) => void;
  colors: any;
}

export function SourcesModal({ open, onClose, sources, onConfirm, colors }: SourcesModalProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(sources.map((f) => [f, true]))
  );

  if (!open) return null;

  const allSelected = sources.every((f) => selected[f]);
  const toggle = (file: string) => setSelected((prev) => ({ ...prev, [file]: !prev[file] }));
  const toggleAll = () => setSelected(Object.fromEntries(sources.map((f) => [f, !allSelected])));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex h-[600px] w-full max-w-[780px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Sources</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <button onClick={toggleAll} className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">Select all</button>
          <span className="text-sm text-neutral-500">{sources.length} files</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {sources.map((file) => (
            <button key={file} onClick={() => toggle(file)} className="flex w-full items-center justify-between border-b border-neutral-100 py-4 text-left dark:border-neutral-800">
              <span className="text-sm text-neutral-800 dark:text-neutral-200">{file}</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded border ${selected[file] ? "border-neutral-800 bg-neutral-800 dark:border-neutral-200 dark:bg-neutral-200" : "border-neutral-300 bg-transparent dark:border-neutral-600"}`}>
                {selected[file] && <Check className="h-3.5 w-3.5 text-white dark:text-neutral-900" />}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-end border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <button onClick={() => onConfirm(Object.keys(selected).filter((k) => selected[k]))} className="rounded-full border border-neutral-300 bg-white px-6 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800">Confirm</button>
        </div>
      </div>
    </div>
  );
}