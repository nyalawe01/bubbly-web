"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { createClient } from "@/app/utils/supabase";
import { ArrowLeft, CheckCircle2, Circle, Clock, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [task, setTask] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.from("tasks").select("*").eq("id", id).single().then(({ data }) => setTask(data));
    supabase.from("task_steps").select("*").eq("task_id", id).order("step_order").then(({ data }) => setSteps(data || []));
  }, [id]);

  if (!task) return <div className="p-8">Loading task...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Tasks
      </button>

      <div className="bg-white border p-6 rounded-xl shadow-sm mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-500 mt-1">{task.description}</p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${task.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
            {task.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all" style={{ width: `${(task.progress || 0) * 100}%` }} />
          </div>
          <span className="text-sm font-medium text-gray-700">{Math.round((task.progress || 0) * 100)}%</span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-4 px-2">Action Timeline</h3>
      
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {steps.map(step => (
          <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 group-[.is-active]:bg-indigo-500 group-[.is-active]:text-indigo-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              {step.status === 'completed' ? <CheckCircle2 size={16} /> : step.status === 'in_progress' ? <PlayCircle size={16} className="animate-pulse" /> : <Circle size={16} />}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-800 text-sm">{step.title}</h4>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{step.action_type.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-sm text-gray-500">{step.description || "System action scheduled."}</p>
              {step.status === 'waiting_for_user' && (
                <button className="mt-3 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md font-medium hover:bg-indigo-100">
                  Approve Action
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
