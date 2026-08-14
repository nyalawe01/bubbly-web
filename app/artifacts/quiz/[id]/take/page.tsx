"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/app/utils/supabase";

export default function TakeQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("notebook_assets").select("*").eq("id", id).single().then(({ data }) => {
      setAsset(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading quiz...</div>;
  if (!asset || asset.type !== "quiz" || !asset.content?.questions) return <div className="p-8">Quiz not found or invalid format.</div>;

  const questions = asset.content.questions;
  const currentQ = questions[currentIndex];

  const handleSelect = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Determine notebook_id. The asset might not have it directly on the row, we need it from notebook_artifacts
    const { data: link } = await supabase.from("notebook_artifacts").select("notebook_id").eq("artifact_id", id).limit(1).single();
    const notebook_id = link?.notebook_id || null;

    const payload = {
      quiz_id: id,
      notebook_id,
      total_questions: questions.length,
      answers: questions.map((q: any, i: number) => ({
        question_index: i,
        question_text: q.q,
        selected_answer: answers[i] ?? -1,
        correct_answer: q.correctIndex,
        topic_tags: q.topics || [] // assuming generator provided topics
      }))
    };

    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    if (data.success) {
      router.push(`/artifacts/quiz/${id}/results/${data.session_id}`);
    } else {
      alert("Failed to submit quiz.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="h-14 bg-white border-b flex items-center px-6 shrink-0 justify-between">
        <h1 className="font-semibold text-gray-800">{asset.title}</h1>
        <div className="text-sm text-gray-500 font-medium">Question {currentIndex + 1} of {questions.length}</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border p-8">
          <h2 className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">
            {currentQ.q}
          </h2>
          
          <div className="space-y-3">
            {currentQ.options?.map((opt: string, i: number) => {
              const isSelected = answers[currentIndex] === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    isSelected ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-indigo-600" : "border-gray-300"
                  }`}>
                    {isSelected && <div className="w-3 h-3 bg-indigo-600 rounded-full" />}
                  </div>
                  <span className={`text-sm ${isSelected ? "text-indigo-900 font-medium" : "text-gray-700"}`}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-20 bg-white border-t flex items-center justify-between px-6 md:px-12 shrink-0 max-w-4xl mx-auto w-full">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 rounded-full text-gray-600 font-medium disabled:opacity-30 hover:bg-gray-100 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Previous
        </button>
        
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            Next <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Quiz"} <CheckCircle2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
