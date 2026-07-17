"use client";
import { useState, useEffect } from "react";
import { Check, Send } from "lucide-react";

export interface FormQuestion {
  id: string;
  question: string;
  type: "choice" | "text";
  options?: string[];
  placeholder?: string;
}

interface QuestionsModalProps {
  open: boolean;
  intro?: string;
  questions: FormQuestion[];
  onSubmit: (answers: { id: string; question: string; answer: string }[]) => void;
  onClose: () => void;
  colors: any;
}

/** A pop-up form the AI raises (via a [QUESTIONS] block) when it needs to understand
 *  the student's situation before giving tailored mentorship. Multiple-choice and
 *  fill-in-the-blank questions; the student answers all, then submits back to the AI. */
export function QuestionsModal({ open, intro, questions, onSubmit, onClose, colors }: QuestionsModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Fresh set of questions -> clear any prior answers.
  useEffect(() => {
    if (open) setAnswers({});
  }, [open, questions]);

  if (!open) return null;

  const setAnswer = (id: string, value: string) => setAnswers((prev) => ({ ...prev, [id]: value }));
  const allAnswered =
    questions.length > 0 && questions.every((q) => (answers[q.id] || "").trim().length > 0);

  const handleSubmit = () => {
    if (!allAnswered) return;
    onSubmit(questions.map((q) => ({ id: q.id, question: q.question, answer: (answers[q.id] || "").trim() })));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border ${colors.borderBase} ${colors.bgCard} shadow-2xl animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 md:p-6">
          <h3 className={`text-base md:text-lg font-semibold ${colors.textPrimary}`}>
            {intro || "A few quick questions"}
          </h3>
          <p className={`text-xs md:text-sm ${colors.textSecondary} mt-1`}>
            Your answers help me tailor this to you.
          </p>

          <div className="mt-5 space-y-6">
            {questions.map((q, qi) => (
              <div key={q.id || qi}>
                <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                  {qi + 1}. {q.question}
                </label>

                {q.type === "choice" && q.options?.length ? (
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswer(q.id, opt)}
                          className={`flex items-center justify-between text-left text-sm rounded-xl border px-3.5 py-2.5 transition-all ${
                            selected
                              ? `${colors.bgActive} border-transparent ${colors.textPrimary}`
                              : `${colors.borderBase} ${colors.bgInput} ${colors.bgHover} ${colors.textSecondary}`
                          }`}
                        >
                          <span>{opt}</span>
                          {selected && <Check size={16} className="flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder || "Type your answer…"}
                    className={`w-full rounded-xl border ${colors.borderBase} ${colors.bgInput} ${colors.textPrimary} px-3.5 py-2.5 text-sm outline-none`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${colors.textSecondary} ${colors.bgHover}`}
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${colors.btnPrimary} ${
                !allAnswered ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Send size={15} />
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
