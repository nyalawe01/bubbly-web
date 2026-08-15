"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase";
import { Users, Plus, BookOpen, LogIn, ChevronRight, LayoutDashboard, Clock, FileCheck } from "lucide-react";
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
    <div className={`p-8 w-full min-h-screen ${colors.bgApp} font-sans`}>
      <div className="max-w-6xl mx-auto relative">
        
        {/* Breadcrumb Header */}
        <div className={`flex items-center gap-2 text-sm font-medium mb-6 ${colors.textSecondary}`}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
          <ChevronRight size={14} className="opacity-50" />
          <span className={`text-violet-500`}>Classrooms</span>
        </div>

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${colors.textPrimary}`}>
              Academic Workspace
            </h1>
            <p className={`mt-1 text-sm ${colors.textSecondary}`}>Manage your courses, assignments, and learning progress.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium transition-all ${colors.bgCard} ${colors.textPrimary} ${colors.borderBase} hover:border-violet-500/50`}>
              <LogIn size={16} /> Join Class
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-premium transition-all hover:scale-105 active:scale-95 ${colors.btnPrimary}`}
            >
              <Plus size={16} /> Create Class
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map(membership => {
            const cls = membership.classrooms;
            const progress = Math.floor(Math.random() * 60) + 20; // Mock progress

            return (
              <Link key={cls.id} href={`/classrooms/${cls.id}`}>
                <div className={`border p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col group relative overflow-hidden ${colors.bgCard} ${colors.borderBase} hover:border-violet-500/50`}>
                  
                  {/* Status Ring / Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold tracking-wider uppercase text-violet-500 bg-violet-500/10 px-2 py-1 rounded w-fit mb-2">
                        {cls.course_code || 'COURSE'}
                      </span>
                      <h3 className={`text-lg font-bold leading-tight group-hover:text-violet-500 transition-colors ${colors.textPrimary}`}>{cls.name}</h3>
                    </div>
                    {/* Mock Status Ring representing active tasks */}
                    <div className="w-10 h-10 rounded-full border-4 border-violet-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-violet-500">3</span>
                    </div>
                  </div>

                  <p className={`text-sm line-clamp-2 mb-6 flex-1 ${colors.textSecondary}`}>{cls.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                      <span className={`${colors.textSecondary}`}>Course Progress</span>
                      <span className={`${colors.textPrimary}`}>{progress}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${colors.bgInput}`}>
                      <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className={`flex items-center justify-between pt-4 border-t ${colors.borderBase}`}>
                    <div className={`flex items-center gap-3 text-xs font-medium ${colors.textSecondary}`}>
                      <span className="flex items-center gap-1 hover:text-violet-500 transition-colors"><BookOpen size={14} /> Materials</span>
                      <span className="flex items-center gap-1 hover:text-violet-500 transition-colors"><FileCheck size={14} /> Tasks</span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${membership.role === 'teacher' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {membership.role}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          
          {classrooms.length === 0 && (
            <div className={`md:col-span-3 text-center py-20 rounded-2xl border border-dashed flex flex-col items-center ${colors.bgInput} ${colors.borderBase} ${colors.textSecondary}`}>
              <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
                <Users size={32} className="text-violet-500" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${colors.textPrimary}`}>No Classrooms Found</h3>
              <p className="text-sm max-w-md">You aren't enrolled in any active learning environments. Create a new class to start teaching, or join an existing one using an invite code.</p>
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
