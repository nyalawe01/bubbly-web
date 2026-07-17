"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  X,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  MonitorPlay,
  ImageIcon,
  FileText,
  Check,
  XCircle,
} from "lucide-react";

interface AssetViewerProps {
  open: boolean;
  onClose: () => void;
  asset: any;
  colors: any;
}

export function AssetViewer({ open, onClose, asset, colors }: AssetViewerProps) {
  const [flashcardState, setFlashcardState] = useState({ index: 0, flipped: false, correct: 0, incorrect: 0 });
  const [slideState, setSlideState] = useState({ index: 0 });

  if (!open || !asset) return null;

  const renderContent = () => {
    if (asset.type === "flashcards") {
      return (
        <div className={`flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[var(--background)]`}>
          <div className="text-sm font-medium mb-4 md:mb-6 text-[var(--text-secondary)]">
            Card {flashcardState.index + 1} of {asset.content.length}
          </div>
          <div
            className="perspective-1000 w-full max-w-lg h-56 md:h-72 cursor-pointer"
            onClick={() => setFlashcardState({ ...flashcardState, flipped: !flashcardState.flipped })}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                flashcardState.flipped ? "rotate-y-180" : ""
              }`}
            >
              <div
                className={`absolute w-full h-full backface-hidden bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-lg flex items-center justify-center p-6 md:p-8 text-center`}
              >
                <h2 className="text-xl md:text-2xl font-medium text-[var(--text-primary)]">
                  {asset.content[flashcardState.index].front}
                </h2>
              </div>
              <div
                className={`absolute w-full h-full backface-hidden rotate-y-180 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-lg flex items-center justify-center p-6 md:p-8 text-center`}
              >
                <p className="text-lg md:text-xl text-[var(--text-primary)] font-medium leading-relaxed">
                  {asset.content[flashcardState.index].back}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 md:mt-10 flex items-center gap-4 md:gap-6">
            <button
              onClick={() => {
                if (flashcardState.index < asset.content.length - 1) {
                  setFlashcardState({
                    index: flashcardState.index + 1,
                    flipped: false,
                    correct: flashcardState.correct,
                    incorrect: flashcardState.incorrect + 1,
                  });
                }
              }}
              className="p-3 md:p-4 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              <XCircle size={24} className="md:w-8 md:h-8" />
            </button>
            <button
              onClick={() => {
                if (flashcardState.index < asset.content.length - 1) {
                  setFlashcardState({
                    index: flashcardState.index + 1,
                    flipped: false,
                    correct: flashcardState.correct + 1,
                    incorrect: flashcardState.incorrect,
                  });
                }
              }}
              className="p-3 md:p-4 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
            >
              <Check size={24} className="md:w-8 md:h-8" />
            </button>
          </div>
          <div className={`mt-4 md:mt-6 text-sm font-medium flex gap-4 text-[var(--text-secondary)]`}>
            <span className="text-emerald-500">Known: {flashcardState.correct}</span>
            <span className="text-red-500">Learning: {flashcardState.incorrect}</span>
          </div>
        </div>
      );
    }

    if (asset.type === "slides") {
      return (
        <div className={`flex-1 flex flex-col p-4 md:p-10 bg-[var(--background)]`}>
          <div
            className={`flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-md p-6 md:p-10 flex flex-col items-center justify-center text-center relative`}
          >
            <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8 max-w-3xl text-[var(--text-primary)]">
              {asset.content[slideState.index].title}
            </h1>
            <ul className="text-base md:text-xl max-w-4xl leading-relaxed text-[var(--text-secondary)] space-y-2 text-left list-disc pl-6">
              {(asset.content[slideState.index].bullets || []).map((b: string, bi: number) => (
                <li key={bi}>{b}</li>
              ))}
            </ul>
            <div className="absolute bottom-4 right-6 text-sm text-[var(--text-secondary)] font-semibold">
              {slideState.index + 1}
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 md:gap-8 mt-4 md:mt-6">
            <button
              onClick={() => setSlideState({ index: Math.max(0, slideState.index - 1) })}
              disabled={slideState.index === 0}
              className="p-2 md:p-3 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-30"
            >
              <ArrowLeft size={20} className="md:w-6 md:h-6 text-[var(--text-secondary)]" />
            </button>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {slideState.index + 1} / {asset.content.length}
            </span>
            <button
              onClick={() => setSlideState({ index: Math.min(asset.content.length - 1, slideState.index + 1) })}
              disabled={slideState.index === asset.content.length - 1}
              className="p-2 md:p-3 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-30"
            >
              <ArrowRight size={20} className="md:w-6 md:h-6 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      );
    }

    if (asset.type === "quiz") {
      return (
        <div className={`flex-1 flex flex-col p-6 bg-[var(--background)] overflow-y-auto hide-scrollbar`}>
          <div className="space-y-6 max-w-3xl mx-auto w-full">
            {asset.content.questions?.map((q: any, idx: number) => (
              <div
                key={idx}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-sm font-mono text-[var(--text-secondary)] mt-0.5">{idx + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{q.q}</p>
                    {q.options && (
                      <div className="mt-3 space-y-1.5">
                        {q.options.map((opt: string, oi: number) => (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 ${
                              oi === q.correctIndex
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                                : "text-[var(--text-secondary)]"
                            }`}
                          >
                            <span className="w-4">{String.fromCharCode(65 + oi)}.</span>
                            <span>{opt}</span>
                            {oi === q.correctIndex && <Check size={12} className="ml-auto" />}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.explanation && (
                      <div className="mt-3 p-2 bg-neutral-100 dark:bg-neutral-900 border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)]">
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (asset.type === "exam") {
      return (
        <div className={`flex-1 flex flex-col p-6 bg-[var(--background)] overflow-y-auto hide-scrollbar`}>
          <div className="space-y-8 max-w-3xl mx-auto w-full">
            {asset.content.sections?.map((section: any, si: number) => (
              <div key={si}>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">{section.name}</h3>
                <div className="space-y-4">
                  {section.questions?.map((q: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-[var(--text-primary)] flex-1">{q.q}</p>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)] whitespace-nowrap">{q.marks} marks</span>
                      </div>
                      {q.type === "mcq" && q.options && (
                        <div className="mt-3 space-y-1.5">
                          {q.options.map((opt: string, oi: number) => (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 ${
                                oi === q.correctIndex
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                                  : "text-[var(--text-secondary)]"
                              }`}
                            >
                              <span className="w-4">{String.fromCharCode(65 + oi)}.</span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(q.type === "short" || q.type === "long") && (
                        <div className="mt-3 space-y-2">
                          {q.modelAnswer && (
                            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-600 dark:text-emerald-400">
                              <span className="font-semibold">Model answer: </span>{q.modelAnswer}
                            </div>
                          )}
                          {q.rubric && (
                            <div className="p-2 bg-neutral-100 dark:bg-neutral-900 border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)]">
                              <span className="font-semibold">Rubric: </span>{q.rubric}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (asset.type === "summary") {
      // Study guides (from /api/exam) are freeform markdown; regular summaries are
      // structured JSON (tldr/sections/keyTerms) — render whichever shape arrived.
      if (asset.content.text) {
        return (
          <div className={`flex-1 flex flex-col p-6 md:p-10 bg-[var(--background)] overflow-y-auto hide-scrollbar`}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 md:p-8 max-w-3xl mx-auto w-full">
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {asset.content.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className={`flex-1 flex flex-col p-6 md:p-10 bg-[var(--background)] overflow-y-auto hide-scrollbar`}>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 md:p-8 max-w-3xl mx-auto w-full space-y-6">
            {asset.content.tldr && (
              <p className="text-base font-medium text-[var(--text-primary)] leading-relaxed">{asset.content.tldr}</p>
            )}
            {asset.content.sections?.map((section: any, si: number) => (
              <div key={si}>
                {section.heading && (
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">{section.heading}</h3>
                )}
                <ul className="space-y-1.5 list-disc pl-5">
                  {section.points?.map((p: string, pi: number) => (
                    <li key={pi} className="text-sm text-[var(--text-secondary)]">{p}</li>
                  ))}
                </ul>
              </div>
            ))}
            {asset.content.keyTerms?.length > 0 && (
              <div className="border-t border-[var(--border)] pt-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Key terms</h3>
                <div className="space-y-2">
                  {asset.content.keyTerms.map((kt: any, ki: number) => (
                    <p key={ki} className="text-sm text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">{kt.term}: </span>{kt.definition}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const getIcon = () => {
    if (asset.type === "quiz" || asset.type === "exam") return <BrainCircuit className="h-5 w-5 text-[var(--text-secondary)]" />;
    if (asset.type === "slides") return <MonitorPlay className="h-5 w-5 text-[var(--text-secondary)]" />;
    if (asset.type === "flashcards") return <ImageIcon className="h-5 w-5 text-[var(--text-secondary)]" />;
    return <FileText className="h-5 w-5 text-[var(--text-secondary)]" />;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          asset.type === "slides" ? "max-w-5xl h-[90vh] md:h-[80vh]" : "max-w-3xl h-auto min-h-[400px] md:min-h-[500px]"
        } bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95`}
      >
        <div className={`flex items-center justify-between p-4 md:p-5 border-b border-[var(--border)]`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--bg-input)] rounded-lg">{getIcon()}</div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)]">{asset.title}</h3>
              <p className="text-[10px] md:text-xs text-[var(--text-secondary)]">{asset.metadata}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full">
            <X size={20} />
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}