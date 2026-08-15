"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { createClient } from "@/app/utils/supabase";
import { ArrowLeft, Users, FileText, CheckSquare, Settings, Bell, MessageSquare, Sparkles, Plus, Clock, FileCheck, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ClassroomDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [classroom, setClassroom] = useState<any>(null);
  const [role, setRole] = useState<string>("student");
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"stream" | "announcements">("stream");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  
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
    <div className={`flex flex-col h-screen font-sans ${colors.bgApp} overflow-hidden`}>
      {/* Header */}
      <div className={`h-16 border-b flex items-center px-6 shrink-0 justify-between z-10 ${colors.bgCard} ${colors.borderBase}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`p-2 rounded-full transition-colors ${colors.textSecondary} ${colors.bgHover}`}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`font-bold ${colors.textPrimary}`}>{classroom.name}</h1>
            <div className={`text-xs ${colors.textSecondary}`}>{classroom.course_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href={`/classrooms/${id}`} className={`py-5 border-b-2 text-violet-500 border-violet-500`}>Overview</Link>
          <Link href={`/classrooms/${id}/assignments`} className={`py-5 border-b-2 border-transparent ${colors.textSecondary} hover:text-violet-500 transition-colors`}>Assignments</Link>
          <Link href={`/notebooks/${classroom.notebook_id}`} className={`py-5 border-b-2 border-transparent flex items-center gap-1 ${colors.textSecondary} hover:text-violet-500 transition-colors`}>
            <Sparkles size={14} className="text-violet-500" /> Materials
          </Link>
          {role === 'teacher' && <button className={`ml-4 p-2 transition-colors ${colors.textSecondary} hover:text-violet-500`}><Settings size={18} /></button>}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto w-full">
            
            {/* Hero / Welcome */}
            <div className={`border rounded-2xl p-8 mb-8 shadow-sm relative overflow-hidden ${colors.bgCard} ${colors.borderBase}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className={`text-2xl font-bold mb-2 ${colors.textPrimary}`}>Welcome to {classroom.name}</h2>
                <p className={`${colors.textSecondary} max-w-2xl`}>{classroom.description}</p>
                
                {role === 'teacher' && (
                  <div className={`mt-6 p-4 border rounded-xl flex items-center justify-between shadow-sm ${colors.bgInput} ${colors.borderBase}`}>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${colors.textSecondary}`}>Invite Code</p>
                      <p className="text-2xl font-mono tracking-widest text-violet-500 mt-1">{classroom.invite_code || "XXXX-YYYY"}</p>
                    </div>
                    <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${colors.btnPrimary}`}>Regenerate</button>
                  </div>
                )}
              </div>
            </div>

            {/* Stream Section */}
            <div className="grid grid-cols-3 gap-8">
              
              {/* Left Column: Upcoming & Roster */}
              <div className="col-span-1 flex flex-col gap-6">
                
                {/* Upcoming Tasks */}
                <div>
                  <h3 className={`font-semibold mb-4 flex items-center justify-between ${colors.textPrimary}`}>
                    <span className="flex items-center gap-2"><Clock size={16} className="text-violet-500"/> Upcoming</span>
                    <button className="text-xs text-violet-500 font-medium hover:underline">View All</button>
                  </h3>
                  <div className={`border rounded-xl shadow-sm overflow-hidden ${colors.bgCard} ${colors.borderBase}`}>
                    {/* Mock Item */}
                    <div 
                      onClick={() => { setSelectedAssignment({ title: "Midterm Essay", due: "Tomorrow" }); setDrawerOpen(true); }}
                      className={`p-4 border-b last:border-0 cursor-pointer transition-colors ${colors.borderBase} ${colors.bgHover}`}
                    >
                      <h4 className={`text-sm font-medium mb-1 ${colors.textPrimary}`}>Midterm Essay Draft</h4>
                      <p className={`text-xs flex items-center gap-1 ${colors.textSecondary}`}><Clock size={12}/> Due Tomorrow at 11:59 PM</p>
                    </div>
                  </div>
                </div>

                {/* Class Roster */}
                <div>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${colors.textPrimary}`}><Users size={16} className="text-violet-500"/> Class Roster ({members.length})</h3>
                  <div className={`border rounded-xl shadow-sm overflow-hidden ${colors.bgCard} ${colors.borderBase}`}>
                    {members.slice(0, 5).map(m => (
                      <div key={m.id} className={`flex items-center justify-between p-3 border-b last:border-0 ${colors.borderBase}`}>
                        <span className={`text-sm truncate ${colors.textPrimary}`}>{m.users?.email?.split('@')[0] || 'User'}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${m.role === 'teacher' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {m.role}
                        </span>
                      </div>
                    ))}
                    {members.length > 5 && (
                      <button className={`w-full p-2 text-xs font-medium text-center transition-colors ${colors.textSecondary} ${colors.bgHover}`}>
                        View all {members.length} members
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: The Stream */}
              <div className="col-span-2">
                <div className={`flex items-center gap-6 mb-6 border-b ${colors.borderBase}`}>
                  <button 
                    onClick={() => setActiveTab("stream")}
                    className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "stream" ? "text-violet-500 border-violet-500" : `border-transparent ${colors.textSecondary} hover:text-violet-500`}`}
                  >
                    System Activity
                  </button>
                  <button 
                    onClick={() => setActiveTab("announcements")}
                    className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "announcements" ? "text-violet-500 border-violet-500" : `border-transparent ${colors.textSecondary} hover:text-violet-500`}`}
                  >
                    Announcements
                  </button>
                </div>

                {/* Post Creator */}
                {role === 'teacher' && activeTab === "announcements" && (
                  <div className={`border rounded-xl p-4 mb-6 shadow-sm flex items-center gap-4 cursor-text transition-colors ${colors.bgCard} ${colors.borderBase} hover:border-violet-500/50`}>
                    <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold shrink-0">T</div>
                    <div className={`text-sm ${colors.textSecondary}`}>Announce something to your class...</div>
                  </div>
                )}

                {/* Feed Items */}
                <div className="space-y-4">
                  {activeTab === "stream" ? (
                    <>
                      {/* System Notification Mock */}
                      <div className={`border rounded-xl p-5 flex gap-4 ${colors.bgCard} ${colors.borderBase}`}>
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                          <FileCheck size={20} />
                        </div>
                        <div>
                          <div className={`text-sm ${colors.textPrimary}`}>
                            <span className="font-semibold">Prof. Smith</span> posted a new assignment: <span className="font-medium text-violet-500 hover:underline cursor-pointer">Midterm Essay Draft</span>
                          </div>
                          <div className={`text-xs mt-1 ${colors.textSecondary}`}>Oct 12 • Due Tomorrow</div>
                        </div>
                      </div>
                      <div className={`border rounded-xl p-5 flex gap-4 ${colors.bgCard} ${colors.borderBase}`}>
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <div className={`text-sm ${colors.textPrimary}`}>
                            <span className="font-semibold">Prof. Smith</span> updated the course materials. Added <span className="font-medium text-violet-500 hover:underline cursor-pointer">Chapter 4 Notes</span>.
                          </div>
                          <div className={`text-xs mt-1 ${colors.textSecondary}`}>Oct 10</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Announcement Mock */}
                      <div className={`border rounded-xl p-5 ${colors.bgCard} ${colors.borderBase}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold shrink-0">T</div>
                          <div>
                            <div className={`text-sm font-semibold ${colors.textPrimary}`}>Prof. Smith</div>
                            <div className={`text-xs ${colors.textSecondary}`}>Oct 12</div>
                          </div>
                        </div>
                        <p className={`text-sm leading-relaxed mb-4 ${colors.textPrimary}`}>
                          Hi everyone, remember that the midterm essay draft is due tomorrow. Please review the rubric in the Course Materials before submitting. If you have any questions, bring them to tomorrow's lecture.
                        </p>
                        <div className={`flex items-center gap-4 pt-3 border-t ${colors.borderBase} ${colors.textSecondary}`}>
                          <button className="flex items-center gap-1 text-xs hover:text-violet-500 transition-colors"><MessageSquare size={14}/> Add class comment</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Right Side Drawer (Assignment Submission) */}
        {drawerOpen && selectedAssignment && (
          <div className={`w-96 border-l flex flex-col shrink-0 shadow-2xl relative z-20 ${colors.bgSidebar} ${colors.borderBase}`}>
            <div className={`h-16 border-b flex items-center justify-between px-6 shrink-0 ${colors.borderBase}`}>
              <h2 className={`font-semibold ${colors.textPrimary}`}>Assignment Details</h2>
              <button onClick={() => setDrawerOpen(false)} className={`p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors ${colors.textSecondary}`}>
                <ArrowLeft size={16} className="rotate-180" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className={`text-xl font-bold mb-2 ${colors.textPrimary}`}>{selectedAssignment.title}</h3>
              <p className={`text-sm font-medium mb-6 ${colors.textSecondary}`}>Due {selectedAssignment.due}</p>
              
              <div className={`border rounded-xl p-4 mb-6 shadow-sm ${colors.bgCard} ${colors.borderBase}`}>
                <div className={`flex items-center justify-between mb-4 ${colors.textPrimary}`}>
                  <span className="font-semibold text-sm">Your Work</span>
                  <span className="text-xs text-amber-500 font-medium">Missing</span>
                </div>
                
                <button className={`w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-dashed mb-3 transition-colors ${colors.bgInput} ${colors.borderBase} ${colors.textSecondary} hover:border-violet-500 hover:text-violet-500`}>
                  <Plus size={16} /> Add or create
                </button>
                
                <button className={`w-full py-2 rounded-lg text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 transition-colors shadow-sm`}>
                  Mark as done
                </button>
              </div>

              <div className="pt-4 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${colors.textPrimary}`}><Sparkles size={14} className="text-violet-500"/> Need Help?</h4>
                <p className={`text-xs mb-3 ${colors.textSecondary}`}>Use the Classroom AI to review the rubric or brainstorm ideas based on course materials.</p>
                <button className={`w-full py-2 rounded-lg text-sm font-medium transition-colors bg-violet-500/10 text-violet-500 hover:bg-violet-500/20`}>
                  Ask Classroom AI
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
