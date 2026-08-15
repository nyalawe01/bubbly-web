"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase";
import { Users, Plus, BookOpen, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NewClassroomModal } from "@/components/modals/NewClassroomModal";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ClassroomsDashboard() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from("classroom_members")
        .select("role, classrooms(*)")
        .eq("user_id", user.user.id);
      
      if (data) setClassrooms(data);
    }
    load();
  }, []);

  return (
    <div className={`p-8 w-full min-h-screen ${colors.bgApp}`}>
      <div className="max-w-5xl mx-auto relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${colors.textPrimary}`}>
              <Users className="text-violet-500" /> Classrooms
            </h1>
            <p className={`mt-1 ${colors.textSecondary}`}>Shared learning environments for your courses.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium ${colors.bgCard} ${colors.textPrimary} ${colors.borderBase} ${colors.bgHover}`}>
              <LogIn size={16} /> Join Class
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-premium transition-all ${colors.btnPrimary}`}
            >
              <Plus size={16} /> Create Class
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
        {classrooms.map(membership => {
          const cls = membership.classrooms;
          return (
            <Link key={cls.id} href={`/classrooms/${cls.id}`}>
              <div className={`border p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between group ${colors.bgCard} ${colors.borderBase} hover:border-violet-500/50`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-violet-500 bg-violet-500/10 px-2 py-1 rounded">
                      {cls.course_code || 'COURSE'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${membership.role === 'teacher' ? 'bg-amber-500/20 text-amber-500' : 'bg-neutral-500/10 text-neutral-400'}`}>
                      {membership.role}
                    </span>
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${colors.textPrimary}`}>{cls.name}</h3>
                  <p className={`text-sm line-clamp-2 ${colors.textSecondary}`}>{cls.description}</p>
                </div>
                <div className={`mt-6 flex items-center gap-4 text-sm border-t pt-4 ${colors.borderBase} ${colors.textSecondary}`}>
                  <div className="flex items-center gap-1"><BookOpen size={14} /> Course Notebook</div>
                </div>
              </div>
            </Link>
          );
        })}
        
        {classrooms.length === 0 && (
          <div className={`md:col-span-2 text-center py-16 rounded-xl border border-dashed flex flex-col items-center ${colors.bgInput} ${colors.borderBase} ${colors.textSecondary}`}>
            <Users size={32} className="opacity-30 mb-4" />
            <p>You aren't in any classrooms yet.</p>
            <p className="text-sm mt-1 opacity-70">Create one to start teaching or ask your teacher for an invite code.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <NewClassroomModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={(id) => {
            setIsModalOpen(false);
            router.push(`/classrooms/${id}`);
          }}
        />
      )}
      </div>
    </div>
  );
}
