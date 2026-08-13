"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase";
import { Users, Plus, BookOpen, LogIn } from "lucide-react";
import Link from "next/link";

export default function ClassroomsDashboard() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const supabase = createClient();

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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-indigo-600" /> Classrooms
          </h1>
          <p className="text-gray-500 mt-1">Shared learning environments for your courses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            <LogIn size={16} /> Join Class
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> Create Class
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {classrooms.map(membership => {
          const cls = membership.classrooms;
          return (
            <Link key={cls.id} href={`/classrooms/${cls.id}`}>
              <div className="bg-white border p-6 rounded-xl shadow-sm hover:border-indigo-300 transition-all cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {cls.course_code || 'COURSE'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${membership.role === 'teacher' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                      {membership.role}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{cls.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{cls.description}</p>
                </div>
                <div className="mt-6 flex items-center gap-4 text-sm text-gray-500 border-t pt-4">
                  <div className="flex items-center gap-1"><BookOpen size={14} /> Course Notebook</div>
                </div>
              </div>
            </Link>
          );
        })}
        
        {classrooms.length === 0 && (
          <div className="md:col-span-2 text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed flex flex-col items-center">
            <Users size={32} className="text-gray-300 mb-4" />
            <p>You aren't in any classrooms yet.</p>
            <p className="text-sm mt-1">Create one to start teaching or ask your teacher for an invite code.</p>
          </div>
        )}
      </div>
    </div>
  );
}
