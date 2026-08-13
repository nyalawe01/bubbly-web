"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase";
import { CheckCircle2, Clock, PlayCircle, Plus } from "lucide-react";
import Link from "next/link";

export default function TasksDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("tasks").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setTasks(data || []);
    });
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Study Tasks</h1>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="grid gap-4">
        {tasks.map(task => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <div className="bg-white border p-5 rounded-xl shadow-sm hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  {task.status === 'completed' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <PlayCircle size={16} className="text-indigo-500" />}
                  {task.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                  {task.status.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${(task.progress || 0) * 100}%` }} />
                  </div>
                  {Math.round((task.progress || 0) * 100)}%
                </div>
              </div>
            </div>
          </Link>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
            No tasks yet. Create one to start an automated study plan!
          </div>
        )}
      </div>
    </div>
  );
}
