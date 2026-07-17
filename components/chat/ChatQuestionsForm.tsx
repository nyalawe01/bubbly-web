"use client";
import { useState, useEffect } from "react";
import { Check, ArrowLeft, ArrowRight, Send, X } from "lucide-react";
import type { FormQuestion } from "@/components/modals/QuestionsModal";

interface ChatQuestionsFormProps {
  intro?: string;
  questions: FormQuestion[];
  onSubmit: (answers: { id: string; question: string; answer: string }[]) => void;
  onClose: () => void;
  colors: any;
}

/** The AI's mentor questions, shown ONE at a time as a card that slides up from just
 *  above the chat composer (its bottom edge sits on the textbox). The student answers
 *  each in turn — tap a choice (auto-advances) or type — then submits on the last one. */
export function ChatQuestionsForm({ intro, questions, onSubmit, onClose, colors }: ChatQuestionsFormProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Reset to the first question whenever a new set is shown.
  useEffect(() => {
    setStep(0);
    setAnswers({});
  }, [questions]);

  if (!questions.length) return null;

  const q = questions[Math.min(step, questions.length - 1)];
  const isLast = step === questions.length - 1;
  const current = answers[q.id] || "";
  const canProceed = current.trim().length > 0;

  const submitAll = () =>
    onSubmit(questions.map((qq) => ({ id: qq.id, question: qq.question, answer: (answers[qq.id] || "").trim() })));

  const goNext = () => {
    if (!canProceed) return;
    if (isLast) submitAll();
    else setStep((s) => s + 1);
  };

  const pickChoice = (opt: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: opt }));
    // Tapping a choice advances on its own — one question at a time.
    if (!isLast) setTimeout(() => setStep((s) => s + 1), 220);
  };

  return (
    <div className="mb-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`mx-auto max-w-2xl rounded-2xl border ${colors.borderBase} ${colors.bgCard} shadow-xl p-4 md:p-5`}>
        {/* progress + dismiss */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-5 bg-[var(--accent)]"
                    : i < step
                    ? "w-2.5 bg-[var(--accent)] opacity-50"
                    : "w-2.5 bg-[var(--border)]"
                }`}
              />
            ))}
          </div>
          <button onClick={onClose} aria-label="Close" className={`p-1 rounded-lg ${colors.bgHover} ${colors.textSecondary}`}>
            <X size={15} />
          </button>
        </div>

        {intro && step === 0 && <p className={`text-xs ${colors.textSecondary} mb-2`}>{intro}</p>}

        <label className={`block text-sm md:text-base font-medium ${colors.textPrimary} mb-3`}>{q.question}</label>

        {q.type === "choice" && q.options?.length ? (
          <div className="flex flex-col gap-2">
            {q.options.map((opt) => {
              const selected = current === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => pickChoice(opt)}
                  className={`flex items-center justify-between text-left text-sm rounded-xl border px-3.5 py-2.5 transition-all ${
                    selected
                      ? `${colors.bgActive} border-transparent`
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
            autoFocus
            type="text"
            value={current}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") goNext();
            }}
            placeholder={q.placeholder || "Type your answer…"}
            className={`w-full rounded-xl border ${colors.borderBase} ${colors.bgInput} ${colors.textPrimary} px-3.5 py-2.5 text-sm outline-none`}
          />
        )}

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`text-sm flex items-center gap-1 ${colors.textSecondary} ${
              step === 0 ? "opacity-0 pointer-events-none" : ""
            }`}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <span className={`text-xs ${colors.textSecondary}`}>
            {step + 1} of {questions.length}
          </span>
          <button
            onClick={goNext}
            disabled={!canProceed}
            className={`text-sm font-medium flex items-center gap-1.5 px-4 py-2 rounded-xl ${colors.btnPrimary} ${
              !canProceed ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLast ? (
              <>
                <Send size={14} /> Submit
              </>
            ) : (
              <>
                Next <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
