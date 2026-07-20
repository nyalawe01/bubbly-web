"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { UploadCloud, Search, FileText, CheckCircle2, Loader2, AlertCircle, ArrowLeft, Trash2, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/app/utils/supabase";
import { IconButton } from "@/components/ui/IconButton";
import { ArtLayer } from "@/components/ui/ArtLayer";

interface VaultFile {
  id: string;
  name: string;
  size: string;
  status: "ready" | "processing" | "failed";
  date: string;
  summary?: string;
}

export default function VaultScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const loadFiles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("vault_documents")
      .select("id, file_name, file_size, ai_summary, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFiles(
        data.map((d: any) => ({
          id: d.id,
          name: d.file_name,
          size: d.file_size,
          status: "ready" as const,
          date: new Date(d.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          summary: d.ai_summary,
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const uploadFile = async (file: File) => {
    const tempId = `temp-${Date.now()}-${file.name}`;
    setFiles((prev) => [
      { id: tempId, name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`, status: "processing", date: "Now" },
      ...prev,
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
      await loadFiles();
    } catch {
      setFiles((prev) => prev.map((f) => (f.id === tempId ? { ...f, status: "failed" } : f)));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(uploadFile);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    Array.from(e.dataTransfer.files || []).forEach(uploadFile);
  };

  const handleDelete = async (file: VaultFile) => {
    setDeleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("vault_embeddings").delete().eq("document_id", file.id).eq("user_id", user.id);
      await supabase.from("vault_documents").delete().eq("id", file.id).eq("user_id", user.id);
    }
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    setSelectedFile(null);
    setDeleting(false);
  };

  const filteredFiles = files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="relative h-[100dvh] overflow-y-auto hide-scrollbar bg-[var(--background)] text-[var(--text-primary)]">
      <ArtLayer surface="vault" />
      <nav className="relative z-20 border-b border-[var(--border)] px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/chat">
            <IconButton icon={ArrowLeft} label="Back to chat" />
          </Link>
          <h1 className="text-lg md:text-xl font-bold">Cognitive Vault</h1>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="icon-motion bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium flex items-center gap-2 hover:opacity-90"
        >
          <UploadCloud size={16} />
          <span className="hidden sm:inline">Upload Files</span>
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-12">
        <div className="relative mb-6 md:mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search documents by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--surface)] border border-white/10 rounded-2xl py-3.5 md:py-4 pl-11 md:pl-12 pr-4 outline-none focus:border-[var(--accent)] transition-colors placeholder:text-zinc-600 text-sm md:text-base"
          />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-6 md:mb-8 rounded-2xl border-2 border-dashed transition-colors p-6 md:p-10 flex flex-col items-center justify-center text-center cursor-pointer ${
            isDragging ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-white/10 hover:border-white/20"
          }`}
        >
          <UploadCloud size={28} className={isDragging ? "text-[var(--accent)]" : "text-zinc-500"} />
          <p className="text-sm text-zinc-300 mt-3 font-medium">Drop files here, or click to browse</p>
          <p className="text-xs text-zinc-600 mt-1">PDF, DOCX, PPTX, XLSX, images, and more</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-500 gap-2 text-sm">
            <Loader2 size={18} className="animate-spin" /> Loading your vault…
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">
            {searchQuery ? "No documents match your search." : "Your vault is empty — upload your first document."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => file.status === "ready" && setSelectedFile(file)}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:-translate-y-0.5 transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-4 right-4">
                  {file.status === "ready" && <CheckCircle2 size={18} className="text-zinc-400" />}
                  {file.status === "processing" && <Loader2 size={18} className="text-[var(--accent)] animate-spin" />}
                  {file.status === "failed" && <AlertCircle size={18} className="text-[var(--danger)]" />}
                </div>

                <div className="h-12 w-12 bg-[var(--surface)] rounded-xl flex items-center justify-center mb-4 border border-white/5 group-hover:border-white/20 transition-colors">
                  <FileText size={24} className={file.status === "failed" ? "text-[var(--danger)]/60" : "text-zinc-300"} />
                </div>

                <h3 className="font-medium text-sm mb-1 truncate pr-8">{file.name}</h3>
                {file.summary && <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{file.summary}</p>}

                <div className="flex items-center justify-between mt-4 text-xs">
                  <span className="text-zinc-500">{file.size} • {file.date}</span>
                  <span className={`font-medium ${
                    file.status === "ready" ? "text-zinc-400" :
                    file.status === "processing" ? "text-[var(--accent)]" :
                    "text-[var(--danger)]"
                  }`}>
                    {file.status === "ready" ? "Indexed" : file.status === "processing" ? "Chunking..." : "Failed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="drawer-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedFile(null)} />
          <div className="relative w-full max-w-lg bg-[var(--surface)] border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-zinc-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{selectedFile.name}</h3>
                  <p className="text-[11px] text-zinc-500">{selectedFile.size} • {selectedFile.date}</p>
                </div>
              </div>
              <IconButton icon={X} label="Close" onClick={() => setSelectedFile(null)} />
            </div>

            {selectedFile.summary && (
              <p className="text-sm text-zinc-400 leading-relaxed mb-5">{selectedFile.summary}</p>
            )}

            <div className="flex items-center gap-2">
              <Link href="/chat" className="flex-1">
                <button className="icon-motion w-full bg-white text-black py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-200">
                  Ask AI about this
                </button>
              </Link>
              <button
                onClick={() => handleDelete(selectedFile)}
                disabled={deleting}
                className="icon-motion px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}