"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  UploadCloud, Search, FileText, CheckCircle2, Loader2, AlertCircle, ArrowLeft, Trash2, X,
  LayoutGrid, Files, Image as ImageIcon, Sparkles, Camera,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/app/utils/supabase";
import { IconButton } from "@/components/ui/IconButton";
import { ArtLayer } from "@/components/ui/ArtLayer";
import { NotebookPickerModal } from "@/components/modals/NotebookPickerModal";

interface VaultFile {
  id: string;
  name: string;
  size: string;
  type?: string;
  status: "ready" | "processing" | "failed";
  previewStatus: "ready" | "pending" | "unavailable" | "broken";
  date: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  contentLoading?: boolean;
}

type VaultFilter = "all" | "documents" | "images";

const IMAGE_EXT = /\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i;

function isImageFile(f: { name: string; type?: string }) {
  return (f.type?.startsWith("image/") || IMAGE_EXT.test(f.name)) && !f.name.toLowerCase().includes(".pdf");
}

export default function VaultScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<VaultFilter>("all");
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pickerFileId, setPickerFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const loadFiles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("vault_documents")
      .select("id, file_name, file_size, file_type, ai_summary, file_content, preview_status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFiles(
        data.map((d: any) => ({
          id: d.id,
          name: d.file_name,
          size: d.file_size,
          type: d.file_type,
          status: "ready" as const,
          previewStatus: d.preview_status || "pending",
          date: new Date(d.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          summary: d.ai_summary,
          content: d.file_content || undefined,
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  // Touch last_accessed when a document is opened, so the backfill script heals
  // the documents the student actually looks at first.
  const touchAccessed = useCallback(
    async (id: string) => {
      supabase
        .from("vault_documents")
        .update({ last_accessed: new Date().toISOString() })
        .eq("id", id)
        .then(() => {}, () => {});
    },
    [supabase]
  );

  // Repair a single document's preview: reconstruct its text from the stored
  // embedding chunks (the same fallback the preview modal already uses) and mark
  // it ready. Documents whose original file is still in storage could be
  // re-extracted through the ingestion pipeline, but that runs server-side in
  // Next.js, so the UI path reconstructs from chunks — faithful enough to restore
  // a usable preview without a round-trip to vision OCR.
  const repairPreview = useCallback(
    async (file: VaultFile) => {
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, previewStatus: "pending" } : f)));
      const { data: chunks } = await supabase
        .from("vault_embeddings")
        .select("content")
        .eq("document_id", file.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      const text = (chunks || []).map((c: any) => c.content || "").join("\n\n").trim();

      if (text) {
        await supabase
          .from("vault_documents")
          .update({ file_content: text, preview_status: "ready" })
          .eq("id", file.id);
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, content: text, previewStatus: "ready" } : f)));
      } else {
        await supabase.from("vault_documents").update({ preview_status: "unavailable" }).eq("id", file.id);
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, previewStatus: "unavailable" } : f)));
      }
    },
    [supabase]
  );

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // When a document is clicked for preview, hydrate the content that wasn't in the
  // list query: new uploads carry file_content on the row; older documents only have
  // their 2.5k-char chunks in vault_embeddings, so reconstruct the text from those.
  // Pure-image uploads additionally persist the original bytes in vault_document_images
  // (see /api/upload) — fetch the first URL so the preview shows the actual image.
  useEffect(() => {
    if (!selectedFile || selectedFile.contentLoading) return;

    // Only auto-hydrate chunk content for docs that are expected to have it.
    // Pending/unavailable/broken docs show their own fallback UI instead.
    if (!selectedFile.content && selectedFile.previewStatus === "ready") {
      setSelectedFile((prev) => (prev ? { ...prev, contentLoading: true } : prev));
      supabase
        .from("vault_embeddings")
        .select("content")
        .eq("document_id", selectedFile.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .then(({ data }) => {
          const text = data?.map((d: any) => d.content || "").join("\n\n") || "";
          setSelectedFile((prev) => (prev ? { ...prev, content: text || "No content available.", contentLoading: false } : prev));
        });
    }

    if (isImageFile(selectedFile) && !selectedFile.imageUrl) {
      supabase
        .from("vault_document_images")
        .select("url")
        .eq("document_id", selectedFile.id)
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0 && data[0].url) {
            setSelectedFile((prev) => (prev ? { ...prev, imageUrl: data[0].url } : prev));
          }
        });
    }
  }, [selectedFile, supabase]);

  const uploadFile = async (file: File) => {
    const tempId = `temp-${Date.now()}-${file.name}`;
    setFiles((prev) => [
      { id: tempId, name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`, type: file.type, status: "processing", previewStatus: "pending", date: "Now" },
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
      await supabase.from("vault_document_images").delete().eq("document_id", file.id).eq("user_id", user.id);
      await supabase.from("vault_documents").delete().eq("id", file.id).eq("user_id", user.id);
    }
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    setSelectedFile(null);
    setDeleting(false);
  };

  const filteredFiles = files.filter((f) => {
    if (!f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filter === "documents") return !isImageFile(f);
    if (filter === "images") return isImageFile(f);
    return true;
  });

  const counts = {
    all: files.length,
    documents: files.filter((f) => !isImageFile(f)).length,
    images: files.filter((f) => isImageFile(f)).length,
  };

  const filterButton = (key: VaultFilter, label: string, icon: React.ReactNode) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`icon-motion w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
        filter === key ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30" : "text-zinc-400 hover:bg-white/5 border border-transparent"
      }`}
    >
      <span className="flex items-center gap-2.5">{icon}{label}</span>
      <span className={`text-[11px] font-semibold ${filter === key ? "text-[var(--accent)]" : "text-zinc-600"}`}>{counts[key]}</span>
    </button>
  );

  return (
    <div className="relative h-[100dvh] overflow-hidden flex bg-[var(--background)] text-[var(--text-primary)]">
      <ArtLayer surface="vault" />

      {/* Sidebar — nav + filters (desktop). Mobile gets a chip row in the main column. */}
      <aside className="relative z-20 hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-md">
        <div className="p-4 flex items-center gap-3">
          <Link href="/chat">
            <IconButton icon={ArrowLeft} label="Back to chat" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold leading-tight truncate">Cognitive Vault</h1>
            <p className="text-[10px] text-zinc-500 truncate">Your study materials</p>
          </div>
        </div>

        <div className="px-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="icon-motion w-full bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90"
          >
            <UploadCloud size={16} />
            Upload Files
          </button>
        </div>

        <div className="mt-6 px-4 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-2 px-1">Filters</p>
          <div className="flex flex-col gap-1">
            {filterButton("all", "All", <LayoutGrid size={15} />)}
            {filterButton("documents", "Documents", <Files size={15} />)}
            {filterButton("images", "Images", <ImageIcon size={15} />)}
          </div>
        </div>

        <div className="p-4 text-[10px] text-zinc-600 leading-relaxed">
          Files are indexed with AI embeddings. Click any document to preview its contents.
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex-1 min-w-0 h-full flex flex-col overflow-y-auto hide-scrollbar">
        <nav className="md:hidden sticky top-0 border-b border-[var(--border)] px-4 py-4 flex items-center justify-between bg-[var(--background)]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link href="/chat">
              <IconButton icon={ArrowLeft} label="Back to chat" />
            </Link>
            <h1 className="text-lg font-bold">Cognitive Vault</h1>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="icon-motion bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] px-3 py-2 rounded-full text-xs font-medium flex items-center gap-2 hover:opacity-90"
          >
            <UploadCloud size={16} />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </nav>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />

        <div className="w-full mx-auto p-4 md:p-8">
          <div className="relative mb-4 md:mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Search documents by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface)] border border-white/10 rounded-2xl py-3.5 md:py-4 pl-11 md:pl-12 pr-4 outline-none focus:border-[var(--accent)] transition-colors placeholder:text-zinc-600 text-sm md:text-base"
            />
          </div>

          {/* Mobile filter row */}
          <div className="md:hidden flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar -mx-1 px-1">
            {filterButton("all", "All", <LayoutGrid size={14} />)}
            {filterButton("documents", "Documents", <Files size={14} />)}
            {filterButton("images", "Images", <ImageIcon size={14} />)}
          </div>

          {files.length === 0 && !loading && (
            <p className="text-[11px] text-zinc-500 mb-4 hidden md:block">Your vault is empty — upload your first document below.</p>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-6 md:mb-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 rounded-2xl border-2 border-dashed transition-colors p-6 md:p-10 flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragging ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-white/10 hover:border-white/20"
              }`}
            >
              <UploadCloud size={28} className={isDragging ? "text-[var(--accent)]" : "text-zinc-500"} />
              <p className="text-sm text-zinc-300 mt-3 font-medium">Drop files here, or click to browse</p>
              <p className="text-xs text-zinc-600 mt-1">PDF, DOCX, PPTX, XLSX, images, and more</p>
            </div>
            
            <button
              onClick={() => {
                // Open device camera logic
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute("capture", "environment");
                  fileInputRef.current.setAttribute("accept", "image/*");
                  fileInputRef.current.click();
                  
                  // Reset attributes after a delay so normal file upload still works
                  setTimeout(() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("capture");
                      fileInputRef.current.setAttribute("accept", "*");
                    }
                  }, 1000);
                }
              }}
              className="md:w-48 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 transition-colors p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-white/5"
            >
              <Camera size={28} className="text-zinc-500 mb-3" />
              <p className="text-sm text-zinc-300 font-medium">Scan Notes</p>
              <p className="text-xs text-zinc-600 mt-1">Take a photo</p>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-500 gap-2 text-sm">
              <Loader2 size={18} className="animate-spin" /> Loading your vault…
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">
              {searchQuery || filter !== "all" ? "No documents match your filter." : "Your vault is empty — upload your first document."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => { if (file.status === "ready") { touchAccessed(file.id); setSelectedFile(file); } }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:-translate-y-0.5 transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-4 right-4">
                    {file.status === "ready" && <CheckCircle2 size={18} className="text-zinc-400" />}
                    {file.status === "processing" && <Loader2 size={18} className="text-[var(--accent)] animate-spin" />}
                    {file.status === "failed" && <AlertCircle size={18} className="text-[var(--danger)]" />}
                  </div>

                  <div className="h-12 w-12 bg-[var(--surface)] rounded-xl flex items-center justify-center mb-4 border border-white/5 group-hover:border-white/20 transition-colors">
                    {isImageFile(file)
                      ? <ImageIcon size={24} className="text-zinc-300" />
                      : <FileText size={24} className={file.status === "failed" ? "text-[var(--danger)]/60" : "text-zinc-300"} />}
                  </div>

                  <h3 className="font-medium text-sm mb-1 truncate pr-8">{file.name}</h3>
                  {file.summary && <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{file.summary}</p>}

                  <div className="flex items-center justify-between mt-4 text-xs gap-2">
                    <span className="text-zinc-500 truncate">{file.size} • {file.date}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {file.previewStatus !== "ready" && (
                        <button
                          type="button"
                          title="Repair preview"
                          onClick={(e) => { e.stopPropagation(); repairPreview(file); }}
                          className="p-1 rounded-md text-zinc-500 hover:text-[var(--accent)] hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Sparkles size={12} />
                        </button>
                      )}
                      <span className={`font-medium ${
                        file.previewStatus === "ready" ? "text-zinc-400" :
                        file.previewStatus === "pending" ? "text-[var(--accent)]" :
                        "text-[var(--danger)]"
                      }`}>
                        {file.previewStatus === "ready" ? "Indexed" :
                         file.previewStatus === "pending" ? "Generating…" :
                         file.previewStatus === "broken" ? "Preview broken" : "Unavailable"}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document preview modal — shows the actual extracted content / image */}
      {selectedFile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-4">
          <div className="drawer-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedFile(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--surface)] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-2 p-3 md:p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-zinc-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{selectedFile.name}</h3>
                  <p className="text-[11px] text-zinc-500 truncate">{selectedFile.size} • {selectedFile.date}</p>
                </div>
              </div>
              <IconButton icon={X} label="Close" onClick={() => setSelectedFile(null)} />
            </div>

             <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6">
               {selectedFile.imageUrl ? (
                 // Actual image content for raster uploads
                  
                 <img
                   src={selectedFile.imageUrl}
                   alt={selectedFile.name}
                   className="max-w-full max-h-[60vh] object-contain rounded-xl mx-auto bg-black/20"
                 />
               ) : selectedFile.previewStatus === "pending" ? (
                 // Preview still being generated (original awaiting re-extraction).
                 <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
                   <Loader2 size={22} className="animate-spin" />
                   <p className="text-sm">Generating preview…</p>
                   <p className="text-xs text-zinc-600 max-w-xs text-center">
                     This document is being indexed. Check back shortly.
                   </p>
                 </div>
               ) : (selectedFile.previewStatus === "unavailable" || selectedFile.previewStatus === "broken") ? (
                 // Original file gone (unavailable) or preview corrupted (broken).
                 <div className="flex flex-col items-center justify-center py-12 gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                     <AlertCircle size={26} className="text-zinc-500" />
                   </div>
                   <p className="text-sm text-zinc-300">
                     {selectedFile.previewStatus === "broken" ? "Preview broken." : "Preview unavailable."}
                   </p>
                   <p className="text-xs text-zinc-600 max-w-xs text-center">
                     The original file is missing, but you can still chat with this document.
                   </p>
                   <button
                     type="button"
                     onClick={() => repairPreview(selectedFile)}
                     className="mt-1 px-4 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/15 text-zinc-200 flex items-center gap-2"
                   >
                     <Sparkles size={14} /> Regenerate from Chunks
                   </button>
                 </div>
               ) : selectedFile.contentLoading ? (
                 <div className="flex items-center justify-center py-16 text-zinc-500 gap-2 text-sm">
                   <Loader2 size={18} className="animate-spin" /> Loading document content…
                 </div>
               ) : (
                 <pre className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed font-sans text-zinc-300 text-[var(--text-primary)]">
                   {selectedFile.content || "No content available."}
                 </pre>
               )}

              {selectedFile.summary && (
                <div className="mt-5 flex items-start gap-2.5 bg-white/[0.03] border border-white/10 rounded-xl p-3 md:p-4">
                  <div className="p-1.5 bg-white/5 rounded-lg mt-0.5 shrink-0">
                    <Sparkles size={14} className="text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">AI Summary</p>
                    <p className="text-xs md:text-sm leading-relaxed text-zinc-400">{selectedFile.summary}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 md:p-4 border-t border-white/10 shrink-0">
              <Link href="/chat" className="flex-1">
                <button className="icon-motion w-full bg-white text-black py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-200">
                  Ask AI about this
                </button>
              </Link>
              <button
                onClick={() => setPickerFileId(selectedFile.id)}
                className="icon-motion px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
              >
                Save to Notebook
              </button>
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

      {pickerFileId && (
        <NotebookPickerModal
          isOpen={!!pickerFileId}
          onClose={() => setPickerFileId(null)}
          resourceId={pickerFileId}
          resourceType="document"
        />
      )}
    </div>
  );
}