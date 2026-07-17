"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X, RotateCcw, Trophy, Loader2 } from "lucide-react";
import { Breadcrumb } from "./Breadcrumb";
import { QuestionChat, type QMsg } from "./QuestionChat";

// content: { title, totalMarks, suggestedMinutes, sections:[{name, questions:[{type,q,marks,options,correctIndex,modelAnswer,rubric}]}] }
interface ExamRunnerProps {
  content: any;
  state: any;
  onState: (next: any) => void;
}

export function ExamRunner({ content, state, onState }: ExamRunnerProps) {
  // Flatten sections into one ordered list, keeping each question's section label.
  const questions = useMemo(() => {
    const flat: any[] = [];
    (content?.sections || []).forEach((s: any) => (s.questions || []).forEach((q: any) => flat.push({ ...q, section: s.name })));
    return flat;
  }, [content]);

  const phase: string = state?.phase || "not_started";
  const answers: Record<string, any> = state?.answers || {};
  const qchats: Record<string, QMsg[]> = state?.qchats || {};
  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0) || content?.totalMarks || 0;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [grading, setGrading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);

  const patch = (p: any) => onState({ ...state, ...p });

  const hasAnswer = (i: number) => {
    const a = answers[i];
    const q = questions[i];
    if (q?.type === "mcq") return a != null;
    return typeof a === "string" && a.trim().length > 0;
  };

  const doSubmit = async () => {
    setConfirmOpen(false);
    setGrading(true);
    const perQuestion: Record<string, any> = {};
    const toGrade: any[] = [];
    questions.forEach((q, i) => {
      if (q.type === "mcq") {
        const correct = answers[i] === q.correctIndex;
        perQuestion[i] = { marks: correct ? q.marks || 0 : 0, correct };
      } else {
        toGrade.push({ id: String(i), question: q.q, answer: answers[i] || "", modelAnswer: q.modelAnswer, rubric: q.rubric, marks: q.marks || 0 });
      }
    });

    if (toGrade.length) {
      try {
        const res = await fetch("/api/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: toGrade }) });
        const data = await res.json();
        (data.results || []).forEach((r: any) => {
          perQuestion[r.id] = { marks: Number(r.marks) || 0, feedback: r.feedback };
        });
      } catch {
        // Grading failed — award 0 for open items so the exam still completes.
        toGrade.forEach((it) => { perQuestion[it.id] = { marks: 0, feedback: "Couldn't grade this automatically." }; });
      }
    }

    const obtained = Object.values(perQuestion).reduce((s: number, p: any) => s + (p.marks || 0), 0);
    setGrading(false);
    setReviewing(false);
    patch({ phase: "submitted", score: { obtained, total: totalMarks, perQuestion } });
  };

  if (grading) {
    return (
      <Centered>
        <Loader2 size={30} className="animate-spin text-[var(--accent)] mb-3" />
        <p className="text-[var(--text-secondary)]">Marking your exam…</p>
      </Centered>
    );
  }

  if (phase === "not_started") {
    return (
      <Centered>
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] mb-2">{content?.title || "Exam"}</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          {questions.length} questions · {totalMarks} marks{content?.suggestedMinutes ? ` · ~${content.suggestedMinutes} min` : ""}
        </p>
        <button onClick={() => patch({ phase: "in_progress", currentIndex: 0, answers: {} })} className="px-6 py-2.5 rounded-xl bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] font-medium">
          Start exam
        </button>
      </Centered>
    );
  }

  if (phase === "submitted") {
    const score = state.score || { obtained: 0, total: totalMarks, perQuestion: {} };
    const pct = score.total ? Math.round((score.obtained / score.total) * 100) : 0;

    if (!reviewing) {
      return (
        <Centered>
          <Trophy size={40} className="text-[var(--accent)] mb-3" />
          <div className="text-4xl font-bold text-[var(--text-primary)]">{Math.round(score.obtained * 10) / 10} / {score.total}</div>
          <p className="text-[var(--text-secondary)] mt-1 mb-6">{pct}% · {content?.title || "Exam"}</p>
          <div className="flex items-center gap-3">
            <button onClick={() => { setReviewIdx(0); setReviewing(true); }} className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium">
              Review answers
            </button>
            <button onClick={() => patch({ phase: "not_started", answers: {}, currentIndex: 0, score: null })} className="px-5 py-2.5 rounded-xl bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] font-medium flex items-center gap-2">
              <RotateCcw size={15} /> Retake
            </button>
          </div>
        </Centered>
      );
    }

    const q = questions[reviewIdx];
    const pq = (score.perQuestion || {})[reviewIdx] || {};
    return (
      <Runner>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setReviewing(false)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">← Back to results</button>
          <span className="text-xs text-[var(--text-secondary)]">Reviewing {reviewIdx + 1} / {questions.length}</span>
        </div>
        <ExamReview q={q} answer={answers[reviewIdx]} pq={pq} />
        <QuestionChat
          ctx={{
            question: q.q,
            options: q.options,
            correctAnswer: q.type === "mcq" ? q.options?.[q.correctIndex] : q.modelAnswer,
            studentAnswer: q.type === "mcq" ? (answers[reviewIdx] != null ? q.options?.[answers[reviewIdx]] : "(not answered)") : answers[reviewIdx] || "(not answered)",
            explanation: q.rubric,
          }}
          thread={qchats[reviewIdx] || []}
          onUpdate={(t) => patch({ qchats: { ...qchats, [reviewIdx]: t } })}
        />
        <div className="flex items-center justify-between mt-5">
          <button disabled={reviewIdx === 0} onClick={() => setReviewIdx((i) => i - 1)} className="text-sm flex items-center gap-1 text-[var(--text-secondary)] disabled:opacity-30"><ArrowLeft size={15} /> Prev</button>
          <button disabled={reviewIdx === questions.length - 1} onClick={() => setReviewIdx((i) => i + 1)} className="text-sm flex items-center gap-1 text-[var(--text-secondary)] disabled:opacity-30">Next <ArrowRight size={15} /></button>
        </div>
      </Runner>
    );
  }

  // in progress
  const idx = state.currentIndex ?? 0;
  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  return (
    <Runner>
      <Breadcrumb total={questions.length} current={idx} isAnswered={hasAnswer} onJump={(i) => patch({ currentIndex: i })} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--text-secondary)]">{q?.section} · Question {idx + 1} of {questions.length}</span>
        <span className="text-xs font-medium text-[var(--text-secondary)]">{q?.marks} marks</span>
      </div>
      <p className="text-lg md:text-xl font-medium text-[var(--text-primary)] mb-5">{q?.q}</p>

      {q?.type === "mcq" ? (
        <div className="space-y-2.5">
          {(q.options || []).map((opt: string, oi: number) => {
            const selected = answers[idx] === oi;
            return (
              <button key={oi} onClick={() => patch({ answers: { ...answers, [idx]: oi } })} className={`w-full flex items-center gap-3 text-left rounded-xl border px-4 py-3 transition-all ${selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)]"}`}>
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold flex-shrink-0 ${selected ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>{String.fromCharCode(65 + oi)}</span>
                <span className="text-sm text-[var(--text-primary)]">{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          value={answers[idx] || ""}
          onChange={(e) => patch({ answers: { ...answers, [idx]: e.target.value } })}
          placeholder="Write your answer…"
          rows={q?.type === "long" ? 8 : 4}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] px-4 py-3 text-sm outline-none resize-y"
        />
      )}

      <div className="flex items-center justify-between mt-6">
        <button disabled={idx === 0} onClick={() => patch({ currentIndex: idx - 1 })} className="text-sm flex items-center gap-1 text-[var(--text-secondary)] disabled:opacity-30"><ArrowLeft size={15} /> Back</button>
        {isLast ? (
          <button disabled={!hasAnswer(idx)} onClick={() => setConfirmOpen(true)} className="px-5 py-2 rounded-xl bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] font-medium disabled:opacity-40">Submit</button>
        ) : (
          <button disabled={!hasAnswer(idx)} onClick={() => patch({ currentIndex: idx + 1 })} className="px-5 py-2 rounded-xl bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] font-medium flex items-center gap-1.5 disabled:opacity-40">Next <ArrowRight size={15} /></button>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Submit exam?</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">You've answered {Object.keys(answers).length} of {questions.length}. Once you submit, it'll be marked and you can review the answers.</p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Keep answering</button>
              <button onClick={doSubmit} className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)]">Yes, submit</button>
            </div>
          </div>
        </div>
      )}
    </Runner>
  );
}

function ExamReview({ q, answer, pq }: { q: any; answer: any; pq: any }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--text-secondary)]">{q.section}</span>
        <span className="text-sm font-semibold text-[var(--accent)]">{Math.round((pq.marks || 0) * 10) / 10} / {q.marks} marks</span>
      </div>
      <p className="text-lg font-medium text-[var(--text-primary)] mb-4">{q.q}</p>

      {q.type === "mcq" ? (
        <div className="space-y-2">
          {(q.options || []).map((opt: string, oi: number) => {
            const isCorrect = oi === q.correctIndex;
            const isChosen = oi === answer;
            return (
              <div key={oi} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : isChosen ? "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
                <span className="w-5 font-semibold">{String.fromCharCode(65 + oi)}</span>
                <span className="flex-1">{opt}</span>
                {isCorrect && <Check size={16} />}
                {isChosen && !isCorrect && <X size={16} />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mb-1">Your answer</div>
            <div className="p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-sm text-[var(--text-primary)] whitespace-pre-wrap">{answer || "(not answered)"}</div>
          </div>
          {pq.feedback && (
            <div className="p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)]"><span className="font-semibold">Feedback: </span>{pq.feedback}</div>
          )}
          {q.modelAnswer && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-300"><span className="font-semibold">Model answer: </span>{q.modelAnswer}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col items-center justify-center text-center p-6">{children}</div>;
}
function Runner({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto hide-scrollbar p-5 md:p-8"><div className="max-w-2xl mx-auto w-full">{children}</div></div>;
}
