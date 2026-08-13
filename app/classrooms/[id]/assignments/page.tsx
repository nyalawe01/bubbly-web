"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase";
import { ArrowLeft, CheckSquare, Plus, Users, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClassroomAssignments({ params }: { params: { id: string } }) {
  const { id } = params;
  const [classroom, setClassroom] = useState<any>(null);
  const [role, setRole] = useState<string>("student");
  const [assignments, setAssignments] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: cls } = await supabase.from("classrooms").select("*").eq("id", id).single();
      setClassroom(cls);

      const { data: membership } = await supabase.from("classroom_members").select("role").eq("classroom_id", id).eq("user_id", user.user.id).single();
      if (membership) setRole(membership.role);

      const { data: assigns } = await supabase.from("assignments").select("*, assignment_submissions(status, score)").eq("classroom_id", id).order("due_date");
      setAssignments(assigns || []);
    }
    load();
  }, [id]);

  if (!classroom) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="h-16 bg-white border-b flex items-center px-6 shrink-0 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{classroom.name}</h1>
            <div className="text-xs text-gray-500">Assignments</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href={`/classrooms/${id}`} className="px-3 py-2 text-gray-500 hover:text-gray-800">Overview</Link>
          <Link href={`/classrooms/${id}/assignments`} className="px-3 py-2 text-indigo-600 border-b-2 border-indigo-600">Assignments</Link>
          <Link href={`/notebooks/${classroom.notebook_id}`} className="px-3 py-2 text-gray-500 hover:text-gray-800">Materials</Link>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Course Assignments</h2>
          {role === 'teacher' && (
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
              <Plus size={16} /> Create Assignment
            </button>
          )}
        </div>

        <div className="space-y-4">
          {assignments.map(a => (
            <div key={a.id} className="bg-white border rounded-xl p-5 shadow-sm hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.assignment_type === 'quiz' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  {a.assignment_type === 'quiz' ? <CheckSquare size={20} /> : <Edit3 size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 font-medium">
                    <span className="uppercase tracking-wider">{a.assignment_type}</span>
                    <span>•</span>
                    <span>Due {new Date(a.due_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{a.points_possible} pts</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {role === 'teacher' ? (
                  <span className="text-sm font-medium text-gray-500 flex items-center gap-1"><Users size={14} /> {a.assignment_submissions?.length || 0} Submitted</span>
                ) : (
                  <button className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-100">Start Assignment</button>
                )}
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-dashed flex flex-col items-center shadow-sm">
              <CheckSquare size={32} className="text-gray-300 mb-4" />
              <p>No assignments posted yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
