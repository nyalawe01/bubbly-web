"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase";
import { ArrowLeft, Save, Sparkles, Wand2, Presentation, FileText, FileQuestion } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useTheme } from "@/components/theme/ThemeProvider";

export default function DocumentWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { colors } = useTheme();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("notebook_assets").select("*").eq("id", id).single().then(({ data }) => {
      setAsset(data);
      setLoading(false);
    });
  }, [id]);

  // Mock auto-save
  const handleSave = async (html: string) => {
    setSaving(true);
    await supabase.from("notebook_assets").update({ content: { body: { html } } }).eq("id", id);
    setSaving(false);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing... Type '/' for AI commands",
      }),
    ],
    content: asset?.content?.body?.html || "",
    onUpdate: ({ editor }) => {
      // Auto-save debounce could be added here
      handleSave(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[700px]',
      },
    },
  });

  // Re-initialize editor when asset loads
  useEffect(() => {
    if (editor && asset && asset.content?.body?.html && editor.isEmpty) {
      editor.commands.setContent(asset.content.body.html);
    }
  }, [asset, editor]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading document...</div>;
  if (!asset) return <div className="p-8">Document not found.</div>;

  return (
    <div className={`flex flex-col h-screen ${colors.bgApp}`}>
      <div className={`h-14 border-b flex items-center px-6 shrink-0 gap-4 justify-between ${colors.bgCard} ${colors.borderBase}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`p-2 rounded-full ${colors.textSecondary} ${colors.bgHover}`}>
            <ArrowLeft size={20} />
          </button>
          <input 
            type="text"
            className={`font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-lg w-64 ${colors.textPrimary}`}
            defaultValue={asset.title}
            onBlur={(e) => supabase.from("notebook_assets").update({ title: e.target.value }).eq("id", id)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-sm ${colors.textSecondary}`}>
            {saving ? "Saving..." : "Saved"} <Save size={14} />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowGenerateMenu(!showGenerateMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors bg-violet-500/10 text-violet-500 hover:bg-violet-500/20`}
            >
              <Sparkles size={16} /> Generate...
            </button>
            {showGenerateMenu && (
              <div className={`absolute top-full mt-2 right-0 w-48 rounded-lg shadow-lg border py-1 z-10 ${colors.bgCard} ${colors.borderBase}`}>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <FileQuestion size={14} className="text-indigo-500" /> Quiz
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <FileText size={14} className="text-emerald-500" /> Flashcards
                </button>
                <button 
                  onClick={() => {
                     setShowGenerateMenu(false);
                     alert("Converting to Presentation prototype initiated...");
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${colors.textPrimary} ${colors.bgHover}`}
                >
                  <Presentation size={14} className="text-blue-500" /> Presentation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={`flex-1 overflow-auto p-12 ${colors.bgApp}`}>
        <div className={`max-w-4xl mx-auto border rounded-lg shadow-sm min-h-[800px] p-12 ${colors.bgCard} ${colors.borderBase}`}>
          <div className={`text-gray-400 text-sm mb-4 border-b pb-2 flex items-center justify-between ${colors.borderBase}`}>
            <span>Editor (TipTap)</span>
            <span className="flex items-center gap-1"><Wand2 size={14}/> Type '/' for AI commands</span>
          </div>
          <EditorContent editor={editor} className={`${colors.textPrimary}`} />
        </div>
      </div>
    </div>
  );
}
