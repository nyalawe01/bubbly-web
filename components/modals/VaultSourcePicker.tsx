"use client";
import { Check, FileText } from "lucide-react";

interface VaultDoc {
  id: string;
  name: string;
  date?: string;
}

interface VaultSourcePickerProps {
  documents: VaultDoc[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  colors: any;
}

/** Lets the student pick from documents ALREADY in their Knowledge Vault, instead
 *  of only being able to attach a fresh file right here in the modal. Without this,
 *  generators had no way to ground on anything uploaded earlier — every generation
 *  silently fell back to generic, topic-only output regardless of what was in the
 *  Vault. Shared across Quiz/Flashcards/Summary/Slides/Exam. */
export function VaultSourcePicker({ documents, selectedIds, onToggle, colors }: VaultSourcePickerProps) {
  if (!documents.length) {
    return (
      <p className={`text-sm ${colors.textSecondary} mb-4`}>
        Your Knowledge Vault is empty — upload a file below to use as a source.
      </p>
    );
  }

  return (
    <div className="space-y-1.5 max-h-52 overflow-y-auto hide-scrollbar mb-4">
      {documents.map((doc) => {
        const selected = selectedIds.includes(doc.id);
        return (
          <button
            key={doc.id}
            type="button"
            onClick={() => onToggle(doc.id)}
            className={`w-full flex items-center gap-3 text-left rounded-xl border px-3.5 py-2.5 transition-colors ${
              selected ? `${colors.bgActive} border-transparent` : `${colors.borderBase} ${colors.bgInput} ${colors.bgHover}`
            }`}
          >
            <span
              className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                selected ? "border-transparent bg-[var(--accent)]" : colors.borderBase
              }`}
            >
              {selected && <Check size={13} className="text-white" />}
            </span>
            <FileText size={14} className={`flex-shrink-0 ${colors.textSecondary}`} />
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-medium truncate ${colors.textPrimary}`}>{doc.name}</div>
              {doc.date && <div className={`text-[11px] ${colors.textSecondary}`}>{doc.date}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
