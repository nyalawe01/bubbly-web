"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, X, RotateCcw, Trophy } from "lucide-react";
import { Breadcrumb } from "./Breadcrumb";
import { QuestionChat, type QMsg } from "./QuestionChat";

// content: { title, questions: [...] } — each question has "type" ("mcq" default):
//   mcq:        { type, q, options[4], correctIndex, explanation }
//   fill_blank: { type, q, modelAnswer, explanation }
//   listing:    { type, q, expectedCount, modelAnswers[], explanation }
//   diagram:    { type, q, imageUrl, modelAnswer, explanation } — text-input like fill_blank, with an image
// state: { phase, currentIndex, answers:{idx: optIdx|string|string[]}, score:{obtained,total},
//          grading:{idx: {correct,score,feedback}} (non-mcq only), qchats:{idx:QMsg[]} }
interface QuizRunnerProps {
  content: any;
  state: any;
  onState: (next: any) => void;
}

export function QuizRunner({ content, state, onState }: QuizRunnerProps) {
  const questions: any[] = content?.questions || [];
  const phase: string = state?.phase || "not_started";
  const answers: Record<string, number | string | string[]> = state?.answers || {};
  const qchats: Record<string, QMsg[]> = state?.qchats || {};

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [grading, setGrading] = useState(false);

  const patch = (p: any) => onState({ ...state, ...p });

  // ---- not started ----
  if (phase === "not_started") {
    return (
      <Centered>
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] mb-2">{content?.title || "Quiz"}</h1>
        <p className="text-[var(--text-secondary)] mb-6">{questions.length} questions · answer them one at a time</p>
        <button
          onClick={() => patch({ phase: "in_progress", currentIndex: 0, answers: {} })}
          className="px-6 py-2.5 rounded-xl bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] font-medium"
        >
          Start quiz
        </button>
      </Centered>
    );
  }

  // ---- submitted: summary or review ----
  if (phase === "submitted") {
    const score = state.score || { obtained: 0, total: questions.length };
    const pct = score.total ? Math.round((score.obtained / score.total) * 100) : 0;

    if (!reviewing) {
      return (
        <Centered>
          <Trophy size={40} className="text-[var(--accent)] mb-3" />
          <div className="text-4xl font-bold text-[var(--text-primary)]">
            {score.obtained} / {score.total}
          </div>
          <p className="text-[var(--text-secondary)] mt-1 mb-6">{pct}% · {content?.title || "Quiz"}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setReviewIdx(0); setReviewing(true); }}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium"
            >
              Review answers
            </button>
            <button
              onClick={() => patch({ phase: "not_started", answers: {}, currentIndex: 0, score: null })}
              className="px-5 py-2.5 rounded-xl bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] font-medium flex items-center gap-2"
            >
              <RotateCcw size={15} /> Retake
            </button>
          </div>
        </Centered>
      );
    }

    // review mode — go through every question with correct answer + per-question chat
    const q = questions[reviewIdx];
    const chosen = answers[reviewIdx];
    return (
      <Runner>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setReviewing(false)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">← Back to results</button>
          <span className="text-xs text-[var(--text-secondary)]">Reviewing {reviewIdx + 1} / {questions.length}</span>
        </div>
        <QuestionReview q={q} chosen={chosen} gradeResult={(state.grading || {})[reviewIdx]} />
        <QuestionChat
          ctx={{
            question: q.q,
            options: q.type === "mcq" || !q.type ? q.options : undefined,
            correctAnswer:
              q.type === "listing" ? (q.modelAnswers || []).join(", ") :
              q.type === "fill_blank" || q.type === "diagram" ? q.modelAnswer :
              q.options?.[q.correctIndex],
            studentAnswer:
              q.type === "listing" ? (Array.isArray(chosen) && chosen.some(Boolean) ? chosen.join(", ") : "(not answered)") :
              q.type === "fill_blank" || q.type === "diagram" ? (chosen || "(not answered)") :
              chosen != null ? q.options?.[chosen as number] : "(not answered)",
            explanation: q.explanation,
          }}
          thread={qchats[reviewIdx] || []}
          onUpdate={(t) => patch({ qchats: { ...qchats, [reviewIdx]: t } })}
        />
        <div className="flex items-center justify-between mt-5">
          <button disabled={reviewIdx === 0} onClick={() => setReviewIdx((i) => i - 1)} className="text-sm flex items-center gap-1 text-[var(--text-secondary)] disabled:opacity-30">
            <ArrowLeft size={15} /> Prev
          </button>
          <button disabled={reviewIdx === questions.length - 1} onClick={() => setReviewIdx((i) => i + 1)} className="text-sm flex items-center gap-1 text-[var(--text-secondary)] disabled:opacity-30">
            Next <ArrowRight size={15} />
          </button>
        </div>
      </Runner>
    );
  }

  // ---- in progress (taking) ----
  const idx = state.currentIndex ?? 0;
  const q = questions[idx];
  const answered = (i: number) => {
    const qq = questions[i];
    const a = answers[i];
    if (!qq) return false;
    if (qq.type === "listing") return Array.isArray(a) && a.some((x: string) => x && x.trim());
    if (qq.type === "fill_blank" || qq.type === "diagram") return typeof a === "string" && a.trim().length > 0;
    return a != null;
  };
  const isLast = idx === questions.length - 1;

  const submit = async () => {
    setGrading(true);
    let obtained = 0;
    const gradableItems: any[] = [];

    questions.forEach((qq, i) => {
      if (qq.type === "listing") {
        gradableItems.push({ id: String(i), type: "listing", question: qq.q, answers: answers[i] || [], modelAnswers: qq.modelAnswers });
      } else if (qq.type === "fill_blank" || qq.type === "diagram") {
        gradableItems.push({ id: String(i), type: "fill_blank", question: qq.q, answer: answers[i] || "", modelAnswer: qq.modelAnswer });
      } else if (answers[i] === qq.correctIndex) {
        obtained += 1;
      }
    });

    const gradingByIdx: Record<number, any> = {};
    if (gradableItems.length) {
      try {
        const res = await fetch("/api/quiz/grade-answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: gradableItems }),
        });
        const data = await res.json();
        const results: any[] = data.results || [];
        const byId = new Map(results.map((r) => [r.id, r]));
        questions.forEach((qq, i) => {
          const r = byId.get(String(i));
          if (!r) return;
          gradingByIdx[i] = r;
          if (qq.type === "listing") {
            const expected = qq.expectedCount || (qq.modelAnswers?.length ?? 1);
            obtained += Math.min(1, (r.matchedCount || 0) / expected);
          } else if (qq.type === "fill_blank" || qq.type === "diagram") {
            obtained += r.correct ? 1 : 0;
          }
        });
      } catch {
        // Grading service failed — those questions just don't add to the score
        // rather than blocking submission entirely.
      }
    }

    setGrading(false);
    setConfirmOpen(false);
    setReviewing(false);
    patch({
      phase: "submitted",
      score: { obtained: Math.round(obtained * 100) / 100, total: questions.length },
      grading: gradingByIdx,
    });
  };

  return (
    <Runner>
      <Breadcrumb total={questions.length} current={idx} isAnswered={answered} onJump={(i) => patch({ currentIndex: i })} />
      <div className="text-xs text-[var(--text-secondary)] mb-2">Question {idx + 1} of {questions.length}</div>
      <p className="text-lg md:text-xl font-medium text-[var(--text-primary)] mb-5">{q?.q}</p>

      {q?.type === "fill_blank" || q?.type === "diagram" ? (
        <div>
          {q.type === "diagram" && q.imageUrl && (
            <img
              src={q.imageUrl}
              alt="Diagram for this question"
              className="w-full max-h-80 object-contain rounded-xl border border-[var(--border)] mb-4 bg-[var(--bg-input)]"
            />
          )}
          <textarea
            value={answers[idx] || ""}
            onChange={(e) => patch({ answers: { ...answers, [idx]: e.target.value } })}
            placeholder="Type your answer…"
            rows={3}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
          />
        </div>
      ) : q?.type === "listing" ? (
        <ListingQuestion
          key={idx}
          q={q}
          value={Array.isArray(answers[idx]) ? (answers[idx] as string[]) : []}
          onChange={(v: string[]) => patch({ answers: { ...answers, [idx]: v } })}
        />
      ) : (
        <div className="space-y-2.5">
          {(q?.options || []).map((opt: string, oi: number) => {
            const selected = answers[idx] === oi;
            return (
              <button
                key={oi}
                onClick={() => patch({ answers: { ...answers, [idx]: oi } })}
                className={`w-full flex items-center gap-3 text-left rounded-xl border px-4 py-3 transition-all ${
                  selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold flex-shrink-0 ${selected ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="text-sm text-[var(--text-primary)]">{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          disabled={idx === 0}
          onClick={() => patch({ currentIndex: idx - 1 })}
          className="text-sm flex items-center gap-1 text-[var(--text-secondary)] disabled:opacity-30"
        >
          <ArrowLeft size={15} /> Back
        </button>
        {isLast ? (
          <button
            disabled={!answered(idx)}
            onClick={() => setConfirmOpen(true)}
            className="px-5 py-2 rounded-xl bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] font-medium disabled:opacity-40"
          >
            Submit
          </button>
        ) : (
          <button
            disabled={!answered(idx)}
            onClick={() => patch({ currentIndex: idx + 1 })}
            className="px-5 py-2 rounded-xl bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] font-medium flex items-center gap-1.5 disabled:opacity-40"
          >
            Next <ArrowRight size={15} />
          </button>
        )}
      </div>

      {confirmOpen && (
        <ConfirmSubmit
          answeredCount={questions.filter((_, i) => answered(i)).length}
          total={questions.length}
          grading={grading}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={submit}
        />
      )}
    </Runner>
  );
}

function QuestionReview({ q, chosen, gradeResult }: { q: any; chosen: any; gradeResult?: any }) {
  if (q.type === "fill_blank" || q.type === "diagram") {
    const correct: boolean | undefined = gradeResult?.correct;
    const answerText = typeof chosen === "string" && chosen.trim() ? chosen : null;
    return (
      <div>
        {q.type === "diagram" && q.imageUrl && (
          <img
            src={q.imageUrl}
            alt="Diagram for this question"
            className="w-full max-h-80 object-contain rounded-xl border border-[var(--border)] mb-4 bg-[var(--bg-input)]"
          />
        )}
        <p className="text-lg font-medium text-[var(--text-primary)] mb-4">{q.q}</p>
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm mb-2 ${
            correct == null
              ? "border-[var(--border)] text-[var(--text-secondary)]"
              : correct
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          <span><span className="font-semibold">Your answer: </span>{answerText || "(not answered)"}</span>
          {correct != null && (correct ? <Check size={16} /> : <X size={16} />)}
        </div>
        <div className="rounded-lg bg-[var(--bg-input)] border border-[var(--border)] p-3 text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Model answer: </span>{q.modelAnswer}
        </div>
        {gradeResult?.feedback && (
          <p className="text-xs text-[var(--text-secondary)] mt-2">{gradeResult.feedback}</p>
        )}
        {q.explanation && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
            {q.explanation}
          </div>
        )}
      </div>
    );
  }

  if (q.type === "listing") {
    const items: string[] = Array.isArray(chosen) ? chosen : [];
    const filled = items.filter((x) => x && x.trim());
    return (
      <div>
        <p className="text-lg font-medium text-[var(--text-primary)] mb-4">{q.q}</p>
        <div className="space-y-2 mb-3">
          {Array.from({ length: q.expectedCount || items.length || 1 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-primary)]">
              {items[i] && items[i].trim() ? items[i] : <span className="text-[var(--text-secondary)]">(blank)</span>}
            </div>
          ))}
        </div>
        {gradeResult && (
          <p className="text-xs text-[var(--text-secondary)] mb-2">
            {gradeResult.matchedCount ?? 0} of {q.expectedCount || items.length} matched a reference answer.
          </p>
        )}
        {filled.length === 0 && <p className="text-xs text-red-500 mb-2">You didn't answer this one.</p>}
        <div className="rounded-lg bg-[var(--bg-input)] border border-[var(--border)] p-3 text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Reference answers: </span>
          {(q.modelAnswers || []).join(", ")}
        </div>
        {q.explanation && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
            {q.explanation}
          </div>
        )}
      </div>
    );
  }

  // mcq (default)
  return (
    <div>
      <p className="text-lg font-medium text-[var(--text-primary)] mb-4">{q.q}</p>
      <div className="space-y-2">
        {(q.options || []).map((opt: string, oi: number) => {
          const isCorrect = oi === q.correctIndex;
          const isChosen = oi === chosen;
          return (
            <div
              key={oi}
              className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${
                isCorrect
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : isChosen
                  ? "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              <span className="w-5 font-semibold">{String.fromCharCode(65 + oi)}</span>
              <span className="flex-1">{opt}</span>
              {isCorrect && <Check size={16} />}
              {isChosen && !isCorrect && <X size={16} />}
            </div>
          );
        })}
      </div>
      {chosen == null && <p className="text-xs text-red-500 mt-2">You didn't answer this one.</p>}
      {q.explanation && (
        <div className="mt-3 p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
          {q.explanation}
        </div>
      )}
    </div>
  );
}

function ListingQuestion({ q, value, onChange }: { q: any; value: string[]; onChange: (v: string[]) => void }) {
  const [page, setPage] = useState(0);
  const perPage = 5;
  const count = Math.max(1, q.expectedCount || 2);
  const totalPages = Math.max(1, Math.ceil(count / perPage));
  const items = Array.from({ length: count }, (_, i) => value[i] || "");

  const setItem = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };

  const start = page * perPage;
  const end = Math.min(count, start + perPage);

  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)] mb-3">
        {totalPages > 1 ? `Items ${start + 1}–${end} of ${count}` : `List ${count} item${count === 1 ? "" : "s"}`}
      </p>
      <div className="space-y-2.5">
        {Array.from({ length: end - start }).map((_, i) => {
          const itemIndex = start + i;
          return (
            <input
              key={itemIndex}
              value={items[itemIndex]}
              onChange={(e) => setItem(itemIndex, e.target.value)}
              placeholder={`Item ${itemIndex + 1}`}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="text-xs text-[var(--text-secondary)] disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="text-xs text-[var(--text-secondary)]">Page {page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs text-[var(--text-secondary)] disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function ConfirmSubmit({
  answeredCount,
  total,
  grading,
  onCancel,
  onConfirm,
}: {
  answeredCount: number;
  total: number;
  grading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={grading ? undefined : onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Submit quiz?</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5">
          You've answered {answeredCount} of {total}. Once you submit you'll see your marks and can review the answers.
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            disabled={grading}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40"
          >
            Keep answering
          </button>
          <button
            disabled={grading}
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] disabled:opacity-60"
          >
            {grading ? "Grading…" : "Yes, submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col items-center justify-center text-center p-6">{children}</div>;
}
function Runner({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto hide-scrollbar p-5 md:p-8"><div className="max-w-2xl mx-auto w-full">{children}</div></div>;
}
