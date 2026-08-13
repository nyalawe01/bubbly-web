"use client";

import { useState, useEffect } from "react";
import { X, Book, Check, Loader2 } from "lucide-react";
import { createClient } from "@/app/utils/supabase";

interface NotebookPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: "document" | "artifact";
}

export function NotebookPickerModal({ isOpen, onClose, resourceId, resourceType }: NotebookPickerModalProps) {
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [linkedNotebookIds, setLinkedNotebookIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchNotebooks() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: nbs } = await supabase
        .from("notebooks")
        .select("id, title, color_hex")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (nbs) setNotebooks(nbs);

      const table = resourceType === "document" ? "notebook_documents" : "notebook_artifacts";
      const idColumn = resourceType === "document" ? "document_id" : "artifact_id";

      const { data: linked } = await supabase
        .from(table)
        .select("notebook_id")
        .eq(idColumn, resourceId);

      if (linked) {
        setLinkedNotebookIds(new Set(linked.map((l: any) => l.notebook_id)));
      }
      setLoading(false);
    }

    fetchNotebooks();
  }, [isOpen, resourceId, resourceType, supabase]);

  const toggleNotebook = (notebookId: string) => {
    const newLinked = new Set(linkedNotebookIds);
    if (newLinked.has(notebookId)) {
      newLinked.delete(notebookId);
    } else {
      newLinked.add(notebookId);
    }
    setLinkedNotebookIds(newLinked);
  };

  const handleSave = async () => {
    setSaving(true);
    const table = resourceType === "document" ? "notebook_documents" : "notebook_artifacts";
    const idColumn = resourceType === "document" ? "document_id" : "artifact_id";

    // Delete existing links
    await supabase.from(table).delete().eq(idColumn, resourceId);

    // Insert new links
    if (linkedNotebookIds.size > 0) {
      const inserts = Array.from(linkedNotebookIds).map(nbId => ({
        notebook_id: nbId,
        [idColumn]: resourceId
      }));
      await supabase.from(table).insert(inserts);
    }

    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Book className="w-5 h-5 text-gray-400" /> Save to Notebook
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : notebooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>You don't have any notebooks yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notebooks.map((nb) => {
                const isSelected = linkedNotebookIds.has(nb.id);
                return (
                  <label
                    key={nb.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nb.color_hex || '#6C47FF' }} />
                      <span className="font-medium text-gray-900">{nb.title}</span>
                    </div>
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${isSelected ? 'bg-indigo-600' : 'border border-gray-300'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => toggleNotebook(nb.id)}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
