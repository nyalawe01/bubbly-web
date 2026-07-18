"use client";
// components/chat/QuickActionPills.tsx
//
// Replaces the old boxed 2x5 generator grid on the empty-chat hero: a single
// horizontal row of pill buttons (rounded-full, border, no icon background —
// the icon just takes on the current theme's text color). Each icon is a
// small hand-built multi-path SVG (not a flat lucide swap) so hovering
// animates its individual strokes rather than the whole glyph as one block,
// following the same Tier-1 pattern as components/ui/icons/*.
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/motion";

type ActionKey = "quiz" | "flashcards" | "slides" | "summary" | "exam";

interface QuickActionPillsProps {
  onOpenQuiz: () => void;
  onOpenFlashcards: () => void;
  onOpenSlides: () => void;
  onOpenSummary: () => void;
  onOpenExam: () => void;
  colors: any;
  labels: Record<ActionKey, string>;
}

// Each icon's parts declare their own hover variant so they move independently —
// the parent pill sets initial="idle" / whileHover="hover" and framer-motion
// propagates that named state to every child that doesn't override it.
function QuizIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <motion.circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth={1.6} variants={{ idle: { scale: 1 }, hover: { scale: 1.06 } }} transition={{ duration: 0.25 }} />
      <motion.circle cx="12" cy="8.2" r="1.3" fill="currentColor" variants={{ idle: { y: 0, opacity: 0.9 }, hover: { y: -1, opacity: 1 } }} transition={{ duration: 0.3, delay: 0 }} />
      <motion.circle cx="8.3" cy="14" r="1.3" fill="currentColor" variants={{ idle: { y: 0, opacity: 0.9 }, hover: { y: 1.5, opacity: 1 } }} transition={{ duration: 0.3, delay: 0.05 }} />
      <motion.circle cx="15.7" cy="14" r="1.3" fill="currentColor" variants={{ idle: { y: 0, opacity: 0.9 }, hover: { y: 1.5, opacity: 1 } }} transition={{ duration: 0.3, delay: 0.1 }} />
      <motion.path d="M12 8.2L8.3 14M12 8.2l3.7 5.8M8.3 14h7.4" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" variants={{ idle: { opacity: 0.5 }, hover: { opacity: 0.9 } }} transition={{ duration: 0.25 }} />
    </svg>
  );
}

function FlashcardsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <motion.rect x="6" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth={1.6} variants={{ idle: { x: 0, y: 0, rotate: 0 }, hover: { x: -1.5, y: 1, rotate: -4 } }} transition={{ duration: 0.28, ease: "easeOut" }} style={{ transformOrigin: "12px 12px" }} />
      <motion.rect x="6" y="7" width="13" height="10" rx="2" fill="var(--background)" stroke="currentColor" strokeWidth={1.6} variants={{ idle: { x: 0, y: 0, rotate: 0, opacity: 0 }, hover: { x: 2, y: -1.5, rotate: 5, opacity: 1 } }} transition={{ duration: 0.28, ease: "easeOut", delay: 0.03 }} style={{ transformOrigin: "12px 12px" }} />
    </svg>
  );
}

function SlidesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <motion.rect x="4" y="5.5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth={1.6} variants={{ idle: { scale: 1 }, hover: { scale: 1.03 } }} transition={{ duration: 0.25 }} style={{ transformOrigin: "12px 11px" }} />
      <motion.path d="M10.3 8.7v5l4.2-2.5-4.2-2.5z" fill="currentColor" variants={{ idle: { scale: 1, opacity: 0.9 }, hover: { scale: 1.18, opacity: 1 } }} transition={{ duration: 0.3, ease: "backOut" }} style={{ transformOrigin: "12px 11px" }} />
      <motion.path d="M9 19h6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" variants={{ idle: { pathLength: 1, opacity: 0.6 }, hover: { pathLength: [0, 1], opacity: 1 } }} transition={{ duration: 0.3 }} />
    </svg>
  );
}

function SummaryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <motion.path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth={1.6} variants={{ idle: { scale: 1 }, hover: { scale: 1.03 } }} transition={{ duration: 0.25 }} style={{ transformOrigin: "12px 12px" }} />
      {[8.3, 11.3, 14.3].map((y, i) => (
        <motion.line
          key={y}
          x1="7.5" y1={y} x2="16" y2={y}
          stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"
          variants={{ idle: { pathLength: 1, opacity: 0.65 }, hover: { pathLength: [0, 1], opacity: 1 } }}
          transition={{ duration: 0.35, delay: i * 0.08 }}
        />
      ))}
    </svg>
  );
}

function ExamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <motion.path d="M12 5L2.5 9.5 12 14l9.5-4.5L12 5z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" variants={{ idle: { y: 0 }, hover: { y: -0.5 } }} transition={{ duration: 0.25 }} />
      <motion.path d="M6.5 11.8V16c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" variants={{ idle: { opacity: 0.85 }, hover: { opacity: 1 } }} transition={{ duration: 0.25 }} />
      <motion.line x1="21.5" y1="9.5" x2="21.5" y2="15" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" variants={{ idle: { rotate: 0 }, hover: { rotate: 14 } }} transition={{ duration: 0.3, ease: "easeOut" }} style={{ transformOrigin: "21.5px 9.5px" }} />
    </svg>
  );
}

const ICONS: Record<ActionKey, () => React.ReactNode> = {
  quiz: QuizIcon,
  flashcards: FlashcardsIcon,
  slides: SlidesIcon,
  summary: SummaryIcon,
  exam: ExamIcon,
};

const ORDER: ActionKey[] = ["quiz", "flashcards", "slides", "summary", "exam"];

export function QuickActionPills({ onOpenQuiz, onOpenFlashcards, onOpenSlides, onOpenSummary, onOpenExam, colors, labels }: QuickActionPillsProps) {
  const handlers: Record<ActionKey, () => void> = {
    quiz: onOpenQuiz,
    flashcards: onOpenFlashcards,
    slides: onOpenSlides,
    summary: onOpenSummary,
    exam: onOpenExam,
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-1 py-0.5 max-w-full">
      {ORDER.map((key, i) => {
        const Icon = ICONS[key];
        return (
          <Reveal key={key} delay={i * 0.06}>
            <motion.button
              type="button"
              onClick={handlers[key]}
              initial="idle"
              whileHover="hover"
              whileTap={{ scale: 0.96 }}
              className={`icon-motion flex-shrink-0 flex items-center gap-1.5 rounded-full border ${colors.borderBase} ${colors.bgCard} ${colors.bgHover} ${colors.textSecondary} px-3.5 py-2 text-[12px] md:text-[13px] font-medium whitespace-nowrap shadow-sm transition-colors`}
            >
              <Icon />
              {labels[key]}
            </motion.button>
          </Reveal>
        );
      })}
    </div>
  );
}
