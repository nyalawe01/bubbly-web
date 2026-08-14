"use client";

import { useState } from "react";
import { X, Calendar, BookOpen } from "lucide-react";
import { createClient } from "@/app/utils/supabase";

interface NewTaskModalProps {
  onClose: () => void;
  onSuccess: (taskId: string) => void;
}

export function NewTaskModal({ onClose, onSuccess }: NewTaskModalProps) {
  const [objective, setObjective] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notebookId, setNotebookId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Must be logged in to create a task.");
      }

      // Step 1: Create the pending task
      const { data: task, error: insertError } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: "Generating Plan...",
        description: objective,
        status: "pending",
        deadline: deadline ? new Date(deadline).toISOString() : null,
        notebook_id: notebookId || null
      }).select().single();

      if (insertError) throw insertError;

      // Step 2: Trigger planning API
      const res = await fetch("/api/tasks/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, objective, notebookId: notebookId || null })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to plan task");
      }

      onSuccess(task.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/40">
          <h2 className="font-semibold text-gray-900">What do you need to accomplish?</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <textarea
              autoFocus
              className="w-full glass-input rounded-xl p-3 text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none"
              rows={3}
              placeholder="e.g. Prepare me for my Database Systems final on December 15th..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5"><Calendar size={12}/> Deadline (Optional)</label>
              <input 
                type="date"
                className="glass-input rounded-lg p-2 text-sm text-gray-700 focus:outline-none"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5"><BookOpen size={12}/> Linked Notebook (Optional)</label>
              <input 
                type="text"
                className="glass-input rounded-lg p-2 text-sm text-gray-700 focus:outline-none placeholder:text-gray-400"
                placeholder="Notebook ID"
                value={notebookId}
                onChange={e => setNotebookId(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs px-1">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!objective.trim() || loading}
              className="px-6 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-premium transition-all"
            >
              {loading ? "Generating Plan..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
