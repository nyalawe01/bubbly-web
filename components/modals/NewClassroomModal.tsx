"use client";

import { useState } from "react";
import { X, Book } from "lucide-react";
import { createClient } from "@/app/utils/supabase";

interface NewClassroomModalProps {
  onClose: () => void;
  onSuccess: (classroomId: string) => void;
}

export function NewClassroomModal({ onClose, onSuccess }: NewClassroomModalProps) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in.");

      // 1. Create the shared notebook (acting as the vault for the class)
      const { data: notebook, error: nbError } = await supabase
        .from("notebooks")
        .insert({ user_id: user.id, name: `${name} Notebook`, is_shared: true })
        .select()
        .single();
        
      if (nbError || !notebook) throw nbError;

      // 2. Create the classroom
      const { data: classroom, error: classError } = await supabase
        .from("classrooms")
        .insert({
          name,
          course_code: courseCode,
          description,
          notebook_id: notebook.id
        })
        .select()
        .single();

      if (classError || !classroom) throw classError;

      // 3. Add the creator as the teacher
      const { error: memberError } = await supabase
        .from("classroom_members")
        .insert({
          classroom_id: classroom.id,
          user_id: user.id,
          role: "teacher"
        });

      if (memberError) throw memberError;

      onSuccess(classroom.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create classroom.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/40">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Book size={18} className="text-indigo-600"/> Create Classroom
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Classroom Name</label>
            <input 
              autoFocus
              type="text"
              required
              className="glass-input rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none"
              placeholder="e.g. Intro to Computer Science"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Course Code (Optional)</label>
            <input 
              type="text"
              className="glass-input rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none"
              placeholder="e.g. CS 101"
              value={courseCode}
              onChange={e => setCourseCode(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Description (Optional)</label>
            <textarea 
              rows={3}
              className="glass-input rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none resize-none"
              placeholder="What is this class about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
            />
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
              disabled={!name.trim() || loading}
              className="px-6 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-premium transition-all"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
