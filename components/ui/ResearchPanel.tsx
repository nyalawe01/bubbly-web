"use client";

import { useState, useEffect } from "react";
import { X, Search, Globe, Library, Plus, BookmarkPlus, Loader2 } from "lucide-react";
import { createClient } from "@/app/utils/supabase";

export function ResearchPanel({ 
  open, 
  onClose,
  notebookId,
  onAddToDocument 
}: { 
  open: boolean; 
  onClose: () => void;
  notebookId?: string;
  onAddToDocument?: (result: any) => void;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"both" | "web" | "vault">("both");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "r") {
        e.preventDefault();
        if (open) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/research/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, scope, notebook_id: notebookId })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      } else {
        console.error(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l shadow-2xl flex flex-col z-50 animate-in slide-in-from-right">
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-gray-50">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Search size={18} className="text-gray-500" /> Research
        </h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 border-b bg-white shrink-0">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search Web & Vault..." 
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading || !query.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
          </button>
        </form>
        
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => setScope("both")} className={`px-3 py-1 text-xs rounded-full border font-medium ${scope === "both" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            All Sources
          </button>
          <button onClick={() => setScope("web")} className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full border font-medium ${scope === "web" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            <Globe size={12} /> Web
          </button>
          <button onClick={() => setScope("vault")} className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full border font-medium ${scope === "vault" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            <Library size={12} /> My Vault
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {results.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Search size={40} className="mb-4 opacity-20" />
            <p className="text-sm">Search to find citations and sources.</p>
          </div>
        )}

        <div className="space-y-4">
          {results.map((r, i) => (
            <div key={i} className="bg-white border rounded-xl p-4 shadow-sm group">
              <div className="flex items-start gap-3 mb-2">
                <div className={`mt-0.5 shrink-0 ${r.source === 'web' ? 'text-blue-500' : 'text-emerald-500'}`}>
                  {r.source === 'web' ? <Globe size={16} /> : <Library size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-gray-900 text-sm hover:underline line-clamp-2">
                    {r.title}
                  </a>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3">{r.snippet}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors">
                  <BookmarkPlus size={14} /> Save Source
                </button>
                {onAddToDocument && (
                  <button 
                    onClick={() => onAddToDocument(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md transition-colors"
                  >
                    <Plus size={14} /> Cite
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
