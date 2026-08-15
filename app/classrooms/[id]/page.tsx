"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { createClient } from "@/app/utils/supabase";
import { ArrowLeft, Users, FileText, CheckSquare, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ClassroomDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [classroom, setClassroom] = useState<any>(null);
  const [role, setRole] = useState<string>("student");
  const [members, setMembers] = useState<any[]>([]);
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

      const { data: mems } = await supabase.from("classroom_members").select("*, users:user_id(email)").eq("classroom_id", id);
      setMembers(mems || []);
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
            <div className={`text-xs ${colors.textSecondary}`}>{classroom.course_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href={`/classrooms/${id}`} className={`px-3 py-2 border-b-2 text-violet-500 border-violet-500`}>Overview</Link>
          <Link href={`/classrooms/${id}/assignments`} className={`px-3 py-2 ${colors.textSecondary} hover:text-violet-500 transition-colors`}>Assignments</Link>
          <Link href={`/notebooks/${classroom.notebook_id}`} className={`px-3 py-2 ${colors.textSecondary} hover:text-violet-500 transition-colors`}>Materials</Link>
          {role === 'teacher' && <button className={`ml-4 p-2 ${colors.textSecondary} hover:text-violet-500`}><Settings size={18} /></button>}
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className={`border rounded-xl p-8 mb-8 shadow-sm ${colors.bgCard} ${colors.borderBase}`}>
          <h2 className={`text-xl font-bold mb-2 ${colors.textPrimary}`}>Welcome to {classroom.name}</h2>
          <p className={`${colors.textSecondary}`}>{classroom.description}</p>
          
          {role === 'teacher' && (
            <div className={`mt-6 p-4 border rounded-lg flex items-center justify-between ${colors.bgInput} ${colors.borderBase}`}>
              <div>
                <p className={`text-sm font-semibold ${colors.textPrimary}`}>Invite Code</p>
                <p className="text-2xl font-mono tracking-widest text-violet-500 mt-1">{classroom.invite_code || "XXXX-YYYY"}</p>
              </div>
              <button className={`px-4 py-2 rounded shadow-sm text-sm font-medium transition-all ${colors.btnPrimary}`}>Generate New Code</button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${colors.textPrimary}`}><CheckSquare size={18} className="opacity-50"/> Upcoming Assignments</h3>
            <div className={`border rounded-xl p-6 text-center text-sm shadow-sm ${colors.bgCard} ${colors.borderBase} ${colors.textSecondary}`}>
              No upcoming assignments.
            </div>
          </div>
          <div>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${colors.textPrimary}`}><Users size={18} className="opacity-50"/> Class Roster ({members.length})</h3>
            <div className={`border rounded-xl shadow-sm overflow-hidden ${colors.bgCard} ${colors.borderBase}`}>
              {members.map(m => (
                <div key={m.id} className={`flex items-center justify-between p-4 border-b last:border-0 ${colors.borderBase} ${colors.bgHover}`}>
                  <span className={`text-sm ${colors.textPrimary}`}>{m.users?.email || 'Unknown User'}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${m.role === 'teacher' ? 'bg-amber-500/20 text-amber-500' : 'bg-neutral-500/10 text-neutral-400'}`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
