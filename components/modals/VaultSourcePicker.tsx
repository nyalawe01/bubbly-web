"use client";
import { useState } from "react";
import { Check, FileText, Eye } from "lucide-react";
import { createClient } from "@/app/utils/supabase";
import { FilePreviewModal } from "./FilePreviewModal";

interface VaultDoc {
  id: string;
  name: string;
  date?: string;
  aiSummary?: string;
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
 *  Vault. Shared across Quiz/Flashcards/Summary/Slides/Exam. The eye button on each
 *  row opens a preview of the document's actual extracted content. */
export function VaultSourcePicker({ documents, selectedIds, onToggle, colors }: VaultSourcePickerProps) {
  const supabase = createClient();
  const [previewDoc, setPreviewDoc] = useState<VaultDoc | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const openPreview = async (doc: VaultDoc) => {
    setPreviewDoc(doc);
    setPreviewContent("");
    setPreviewLoading(true);
    // Older documents only store their 2.5k-char chunks in vault_embeddings —
    // reconstruct the full text from those (file_content is populated for new
    // uploads but isn't fetched into these list objects here).
    const { data } = await supabase
      .from("vault_embeddings")
      .select("content")
      .eq("document_id", doc.id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    setPreviewContent(data?.map((d: any) => d.content || "").join("\n\n") || "No content available.");
    setPreviewLoading(false);
  };

  if (!documents.length) {
    return (
      <p className={`text-sm ${colors.textSecondary} mb-4`}>
        Your Knowledge Vault is empty — upload a file below to use as a source.
      </p>
    );
  }

  return (
    <>
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
              <span
                role="button"
                tabIndex={0}
                aria-label={`Preview ${doc.name}`}
                title="Preview document"
                onClick={(e) => { e.stopPropagation(); openPreview(doc); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); openPreview(doc); } }}
                className={`p-1.5 rounded-lg flex-shrink-0 ${colors.textSecondary} hover:${colors.bgCard} hover:${colors.textPrimary} transition-colors cursor-pointer`}
              >
                <Eye size={14} />
              </span>
            </button>
          );
        })}
      </div>

      {previewDoc && (
        <FilePreviewModal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          file={{ name: previewDoc.name, content: previewLoading ? "(loading…)" : previewContent, aiSummary: previewDoc.aiSummary }}
          colors={colors}
          zClassName="z-[70]"
        />
      )}
    </>
  );
}