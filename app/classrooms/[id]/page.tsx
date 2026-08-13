"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase";
import { ArrowLeft, Users, FileText, CheckSquare, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClassroomDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const [classroom, setClassroom] = useState<any>(null);
  const [role, setRole] = useState<string>("student");
  const [members, setMembers] = useState<any[]>([]);
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

      const { data: mems } = await supabase.from("classroom_members").select("*, users:user_id(email)").eq("classroom_id", id);
      setMembers(mems || []);
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
            <div className="text-xs text-gray-500">{classroom.course_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href={`/classrooms/${id}`} className="px-3 py-2 text-indigo-600 border-b-2 border-indigo-600">Overview</Link>
          <Link href={`/classrooms/${id}/assignments`} className="px-3 py-2 text-gray-500 hover:text-gray-800">Assignments</Link>
          <Link href={`/notebooks/${classroom.notebook_id}`} className="px-3 py-2 text-gray-500 hover:text-gray-800">Materials</Link>
          {role === 'teacher' && <button className="ml-4 p-2 text-gray-400 hover:text-gray-700"><Settings size={18} /></button>}
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white border rounded-xl p-8 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Welcome to {classroom.name}</h2>
          <p className="text-gray-600">{classroom.description}</p>
          
          {role === 'teacher' && (
            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-900">Invite Code</p>
                <p className="text-2xl font-mono tracking-widest text-indigo-700 mt-1">{classroom.invite_code || "XXXX-YYYY"}</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded shadow-sm text-sm font-medium hover:bg-indigo-700">Generate New Code</button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CheckSquare size={18} className="text-gray-400"/> Upcoming Assignments</h3>
            <div className="bg-white border rounded-xl p-6 text-center text-gray-500 text-sm shadow-sm">
              No upcoming assignments.
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users size={18} className="text-gray-400"/> Class Roster ({members.length})</h3>
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-gray-50">
                  <span className="text-sm text-gray-700">{m.users?.email || 'Unknown User'}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${m.role === 'teacher' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
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
