"use client";

import { useState } from "react";
import { X, Calendar, CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/app/utils/supabase";

interface StudyPlanViewerProps {
  open: boolean;
  onClose: () => void;
  asset: any;
}

export function StudyPlanViewer({ open, onClose, asset }: StudyPlanViewerProps) {
  const [plan, setPlan] = useState(asset?.content);
  const supabase = createClient();

  if (!open || !asset) return null;

  const toggleTask = async (weekIndex: number, taskIndex: number) => {
    const newPlan = { ...plan };
    newPlan.weeks[weekIndex].tasks[taskIndex].completed = !newPlan.weeks[weekIndex].tasks[taskIndex].completed;
    setPlan(newPlan);

    // Save state back to notebook_assets
    await supabase
      .from("notebook_assets")
      .update({ content: newPlan })
      .eq("id", asset.id);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95"
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--bg-input)] rounded-lg">
              <Calendar className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)]">{asset.title}</h3>
              <p className="text-[10px] md:text-xs text-[var(--text-secondary)]">Study Plan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {plan?.recommendations && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <h4 className="font-semibold text-indigo-900 mb-2">Recommendations</h4>
              <ul className="list-disc pl-5 space-y-1">
                {plan.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm text-indigo-800">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {plan?.weeks?.map((week: any, weekIdx: number) => (
            <div key={weekIdx} className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Week {week.week_number}</span>
                {week.focus}
              </h4>
              <div className="space-y-2">
                {week.tasks?.map((task: any, taskIdx: number) => (
                  <div
                    key={taskIdx}
                    onClick={() => toggleTask(weekIdx, taskIdx)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      task.completed ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-indigo-300 shadow-sm"
                    }`}
                  >
                    <div className="mt-0.5">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${task.completed ? "line-through text-gray-500" : "font-medium text-gray-900"}`}>
                        {task.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Est. {task.estimated_minutes} mins</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!plan?.weeks?.length && (
            <div className="text-center text-gray-500 py-8">
              No plan content available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
