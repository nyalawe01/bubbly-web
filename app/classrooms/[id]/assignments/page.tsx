"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { createClient } from "@/app/utils/supabase";
import { ArrowLeft, CheckSquare, Plus, Users, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ClassroomAssignments({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [classroom, setClassroom] = useState<any>(null);
  const [role, setRole] = useState<string>("student");
  const [assignments, setAssignments] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();
  const { colors } = useTheme();

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
    <div className={`flex flex-col h-screen ${colors.bgApp}`}>
      <div className={`h-16 border-b flex items-center px-6 shrink-0 justify-between ${colors.bgCard} ${colors.borderBase}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`p-2 rounded-full ${colors.textSecondary} ${colors.bgHover}`}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`font-bold ${colors.textPrimary}`}>{classroom.name}</h1>
            <div className={`text-xs ${colors.textSecondary}`}>Assignments</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href={`/classrooms/${id}`} className={`px-3 py-2 ${colors.textSecondary} hover:text-violet-500 transition-colors`}>Overview</Link>
          <Link href={`/classrooms/${id}/assignments`} className={`px-3 py-2 border-b-2 text-violet-500 border-violet-500`}>Assignments</Link>
          <Link href={`/notebooks/${classroom.notebook_id}`} className={`px-3 py-2 ${colors.textSecondary} hover:text-violet-500 transition-colors`}>Materials</Link>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>Course Assignments</h2>
          {role === 'teacher' && (
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all ${colors.btnPrimary}`}>
              <Plus size={16} /> Create Assignment
            </button>
          )}
        </div>

        <div className="space-y-4">
          {assignments.map(a => (
            <div key={a.id} className={`border rounded-xl p-5 shadow-sm transition-all cursor-pointer flex items-center justify-between ${colors.bgCard} ${colors.borderBase} hover:border-violet-500/50`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.assignment_type === 'quiz' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {a.assignment_type === 'quiz' ? <CheckSquare size={20} /> : <Edit3 size={20} />}
                </div>
                <div>
                  <h3 className={`font-semibold ${colors.textPrimary}`}>{a.title}</h3>
                  <p className={`text-sm mt-1 ${colors.textSecondary}`}>{a.description}</p>
                  <div className={`flex items-center gap-3 mt-3 text-xs font-medium opacity-50 ${colors.textPrimary}`}>
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
                  <span className={`text-sm font-medium flex items-center gap-1 ${colors.textSecondary}`}><Users size={14} /> {a.assignment_submissions?.length || 0} Submitted</span>
                ) : (
                  <button className="px-4 py-2 bg-violet-500/10 text-violet-500 font-medium text-sm rounded-lg hover:bg-violet-500/20 transition-colors">Start Assignment</button>
                )}
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className={`text-center py-16 rounded-xl border border-dashed flex flex-col items-center shadow-sm ${colors.bgInput} ${colors.borderBase} ${colors.textSecondary}`}>
              <CheckSquare size={32} className="opacity-30 mb-4" />
              <p className="opacity-70">No assignments posted yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
