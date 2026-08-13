"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase";
import { ArrowLeft, Activity, CheckCircle2, AlertCircle, Bot, Settings as SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AgentsActivityFeed() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadRuns() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from("agent_runs")
        .select("*, agents(name, description)")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(20);
        
      if (data) setRuns(data);
      setLoading(false);
    }
    loadRuns();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="h-14 bg-white border-b flex items-center px-6 shrink-0 gap-4 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity size={18} className="text-indigo-600" />
            Agent Activity Feed
          </h1>
        </div>
        <button 
          onClick={() => { /* Should open settings modal to agents tab in a real flow, but for now we'll simulate */ }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <SettingsIcon size={16} /> Manage Agents
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-4">
            <Bot size={24} className="text-indigo-600 mt-1 shrink-0" />
            <div>
              <h2 className="font-semibold text-indigo-900">Your AI Study Managers</h2>
              <p className="text-sm text-indigo-700 mt-1">
                EduOS agents run securely in the background to monitor your progress, detect knowledge gaps, and prepare materials before you even ask. Review their actions below.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading activity...</div>
          ) : runs.length === 0 ? (
            <div className="text-center text-gray-500 py-12 border-2 border-dashed rounded-xl">
              No autonomous actions have been taken yet.
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <div key={run.id} className="bg-white border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{run.agents?.name || "Agent"}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {run.trigger_reason}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      {run.status === "completed" ? (
                        <><CheckCircle2 size={12} className="text-emerald-500"/> Completed</>
                      ) : run.status === "running" ? (
                        <span className="animate-pulse text-amber-500">Running...</span>
                      ) : (
                        <><AlertCircle size={12} className="text-red-500"/> Failed</>
                      )}
                      {" • " + new Date(run.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {run.output_summary || "No summary provided."}
                  </p>

                  {run.actions_taken && run.actions_taken.length > 0 && (
                    <div className="mt-4 border-t pt-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Actions Taken</h4>
                      <ul className="space-y-1.5">
                        {run.actions_taken.map((action: any, i: number) => (
                          <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            {action.type === "generate_catch_up_plan" && "Generated catch-up study plan"}
                            {action.type === "notify" && `Sent notification: "${action.message}"`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                      Why did this run?
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
