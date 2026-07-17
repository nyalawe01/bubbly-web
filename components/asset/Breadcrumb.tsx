"use client";

/** Progress breadcrumb: renders chips for questions 0..current only (answered +
 *  the current one) — future questions are never shown. Answered chips are tappable
 *  to jump back. "of N" communicates the total without revealing what's ahead. */
export function Breadcrumb({
  total,
  current,
  isAnswered,
  onJump,
}: {
  total: number;
  current: number;
  isAnswered: (i: number) => boolean;
  onJump: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-5">
      {Array.from({ length: current + 1 }).map((_, i) => (
        <button
          key={i}
          onClick={() => onJump(i)}
          className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border transition-colors ${
            i === current
              ? "bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] border-transparent"
              : isAnswered(i)
              ? "bg-[var(--accent-soft)] text-[var(--accent)] border-transparent"
              : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border)]"
          }`}
        >
          {i + 1}
        </button>
      ))}
      <span className="text-xs text-[var(--text-secondary)] ml-1">of {total}</span>
    </div>
  );
}
