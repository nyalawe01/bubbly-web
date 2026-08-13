"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, XCircle, ArrowLeft, BrainCircuit } from "lucide-react";
import { createClient } from "@/app/utils/supabase";

export default function QuizResultsPage({ params }: { params: { id: string; session_id: string } }) {
  const { id, session_id } = params;
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    Promise.all([
      supabase.from("quiz_sessions").select("*").eq("id", session_id).single(),
      supabase.from("quiz_answers").select("*").eq("session_id", session_id).order("question_index", { ascending: true })
    ]).then(([sessRes, ansRes]) => {
      setSession(sessRes.data);
      setAnswers(ansRes.data || []);
      setLoading(false);
    });
  }, [session_id]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading results...</div>;
  if (!session) return <div className="p-8">Session not found.</div>;

  // Calculate topic breakdown
  const topics: Record<string, { total: number; correct: number }> = {};
  for (const a of answers) {
    const tags = a.topic_tags || ["General"];
    const displayTag = tags.length > 0 ? tags[0] : "General";
    if (!topics[displayTag]) topics[displayTag] = { total: 0, correct: 0 };
    topics[displayTag].total += 1;
    if (a.is_correct) topics[displayTag].correct += 1;
  }

  const handleReviewWeakAreas = async () => {
    // Navigate back to notebook dashboard to see remediation options, 
    // or trigger an API call right here.
    if (session.notebook_id) {
      router.push(`/notebooks/${session.notebook_id}`);
    } else {
      router.push("/vault"); // fallback
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="h-14 bg-white border-b flex items-center px-6 shrink-0 gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-gray-800">Quiz Results</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {session.correct_answers} / {session.total_questions}
            </h2>
            <p className="text-gray-500 font-medium">({session.score_percentage}%)</p>
            
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {Object.entries(topics).map(([topic, stats]) => (
                <div key={topic} className="px-4 py-2 bg-gray-50 border rounded-xl flex flex-col items-center min-w-[120px]">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1 truncate max-w-[150px]">{topic}</span>
                  <span className={`text-sm font-bold ${stats.correct === stats.total ? "text-emerald-600" : stats.correct === 0 ? "text-red-600" : "text-amber-600"}`}>
                    {stats.correct}/{stats.total} correct
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleReviewWeakAreas}
              className="mt-8 px-6 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 mx-auto"
            >
              <BrainCircuit size={18} /> Review Weak Areas
            </button>
          </div>

          {/* Detailed Answers */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg px-2">Detailed Review</h3>
            {answers.map((a, i) => (
              <div key={i} className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${a.is_correct ? "border-l-emerald-500" : "border-l-red-500"}`}>
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {a.is_correct ? <Check className="text-emerald-500 w-5 h-5" /> : <XCircle className="text-red-500 w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-4">{a.question_index + 1}. {a.question_text}</p>
                    
                    {!a.is_correct && (
                      <div className="mb-2 p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-100 flex items-start gap-2">
                        <span className="font-semibold shrink-0">Your answer:</span> 
                        {/* We don't have the text of the selected option easily accessible here unless we stored it, or we fetch the quiz artifact. */}
                        <span>Option {a.selected_answer + 1}</span>
                      </div>
                    )}
                    
                    <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm border border-emerald-100 flex items-start gap-2">
                      <span className="font-semibold shrink-0">Correct answer:</span> 
                      <span>Option {a.correct_answer + 1}</span>
                    </div>

                    {a.topic_tags?.length > 0 && (
                      <div className="mt-4 flex gap-2">
                        {a.topic_tags.map((t: string) => (
                          <span key={t} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] uppercase font-bold tracking-wider">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
