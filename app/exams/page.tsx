"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Play, Clock, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { IconButton } from "@/components/ui/IconButton";

export default function ExamsScreen() {
  const [activeTab, setActiveTab] = useState<"available" | "completed">("available");

  const mockExams = [
    { title: "Cellular Biology Midterm Prep", questions: 25, time: "45 mins", score: null, status: "ready" },
    { title: "React State & Hooks", questions: 10, time: "15 mins", score: null, status: "ready" },
    { title: "Organic Chemistry Basics", questions: 20, time: "30 mins", score: "92%", status: "completed" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-white">
      <nav className="border-b border-white/10 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 bg-[var(--background)]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/chat">
            <IconButton icon={ArrowLeft} label="Back to chat" />
          </Link>
          <h1 className="text-lg md:text-xl font-bold">Exam Sandbox</h1>
        </div>
        <button className="icon-motion bg-[var(--accent)] text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium flex items-center gap-2 hover:bg-[var(--accent-hover)]">
          <Sparkles size={16} />
          <span className="hidden sm:inline">Generate Quiz</span>
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
          <div className="bg-[var(--surface)] border border-white/5 rounded-2xl p-5">
            <div className="text-3xl font-bold mb-1">12</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Quizzes</div>
          </div>
          <div className="bg-[var(--surface)] border border-white/5 rounded-2xl p-5">
            <div className="text-3xl font-bold mb-1 text-[var(--accent)]">85%</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Average Score</div>
          </div>
          <div className="bg-[var(--surface)] border border-white/5 rounded-2xl p-5">
            <div className="text-3xl font-bold mb-1 text-[var(--success)]">3</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Ready to Take</div>
          </div>
        </div>

        <div className="flex gap-6 border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab("available")}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "available" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Available Exams
            {activeTab === "available" && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--accent)] rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "completed" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Completed
            {activeTab === "completed" && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--accent)] rounded-t-full" />}
          </button>
        </div>

        <div className="space-y-4">
          {mockExams
            .filter((exam) => (activeTab === "available" ? exam.status === "ready" : exam.status === "completed"))
            .map((exam, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl mt-1 ${exam.status === "completed" ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--accent)]/10 text-[var(--accent)]"}`}>
                    {exam.status === "completed" ? <CheckCircle size={20} /> : <Brain size={20} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{exam.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1"><Brain size={12} /> {exam.questions} Questions</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {exam.time}</span>
                    </div>
                  </div>
                </div>

                {exam.status === "ready" ? (
                  <button className="icon-motion w-full sm:w-auto bg-white text-black px-6 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-zinc-200">
                    Start Exam <Play size={16} className="fill-current" />
                  </button>
                ) : (
                  <div className="w-full sm:w-auto text-center sm:text-right px-6 py-2.5">
                    <span className="text-xl font-bold text-white">{exam.score}</span>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Final Score</div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}