"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowLeft, ArrowRight, Check, XCircle } from "lucide-react";

export function FlashcardPanel({ content }: { content: any }) {
  const cards: any[] = content?.cards || [];
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [learning, setLearning] = useState(0);
  if (!cards.length) return <Empty label="No cards." />;
  const card = cards[i];
  const next = (wasKnown: boolean) => {
    if (i < cards.length - 1) {
      wasKnown ? setKnown((k) => k + 1) : setLearning((l) => l + 1);
      setI(i + 1);
      setFlipped(false);
    }
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="text-sm font-medium mb-4 md:mb-6 text-[var(--text-secondary)]">Card {i + 1} of {cards.length}</div>
      <div className="perspective-1000 w-full max-w-lg h-56 md:h-72 cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? "rotate-y-180" : ""}`}>
          <div className="absolute w-full h-full backface-hidden bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-lg flex items-center justify-center p-6 md:p-8 text-center">
            <h2 className="text-xl md:text-2xl font-medium text-[var(--text-primary)]">{card.front}</h2>
          </div>
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-lg flex items-center justify-center p-6 md:p-8 text-center">
            <p className="text-lg md:text-xl text-[var(--text-primary)] font-medium leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center gap-4 md:gap-6">
        <button onClick={() => next(false)} className="p-3 md:p-4 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"><XCircle size={24} /></button>
        <button onClick={() => next(true)} className="p-3 md:p-4 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><Check size={24} /></button>
      </div>
      <div className="mt-4 text-sm font-medium flex gap-4 text-[var(--text-secondary)]">
        <span className="text-emerald-500">Known: {known}</span>
        <span className="text-red-500">Learning: {learning}</span>
      </div>
    </div>
  );
}

export function SlidePanel({ content }: { content: any }) {
  const slides: any[] = content?.slides || [];
  const [i, setI] = useState(0);
  if (!slides.length) return <Empty label="No slides." />;
  const slide = slides[i];
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8">
      <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-md p-6 md:p-10 flex flex-col items-center justify-center text-center relative">
        <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8 max-w-3xl text-[var(--text-primary)]">{slide.title}</h1>
        <ul className="text-base md:text-xl max-w-3xl leading-relaxed text-[var(--text-secondary)] space-y-2 text-left list-disc pl-6">
          {(slide.bullets || []).map((b: string, bi: number) => <li key={bi}>{b}</li>)}
        </ul>
        <div className="absolute bottom-4 right-6 text-sm text-[var(--text-secondary)] font-semibold">{i + 1}</div>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} className="p-2 md:p-3 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-30"><ArrowLeft size={20} className="text-[var(--text-secondary)]" /></button>
        <span className="text-sm font-medium text-[var(--text-secondary)]">{i + 1} / {slides.length}</span>
        <button onClick={() => setI(Math.min(slides.length - 1, i + 1))} disabled={i === slides.length - 1} className="p-2 md:p-3 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-30"><ArrowRight size={20} className="text-[var(--text-secondary)]" /></button>
      </div>
    </div>
  );
}

export function SummaryPanel({ content }: { content: any }) {
  if (content?.text) {
    return (
      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 md:p-10">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 md:p-8 max-w-3xl mx-auto w-full">
          <div className="prose prose-base dark:prose-invert max-w-none ai-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{content.text}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-6 md:p-10">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        {content?.tldr && <p className="text-base font-medium text-[var(--text-primary)] leading-relaxed">{content.tldr}</p>}
        {(content?.sections || []).map((section: any, si: number) => (
          <div key={si}>
            {section.heading && <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">{section.heading}</h3>}
            <ul className="space-y-1.5 list-disc pl-5">
              {(section.points || []).map((p: string, pi: number) => <li key={pi} className="text-sm text-[var(--text-secondary)]">{p}</li>)}
            </ul>
          </div>
        ))}
        {content?.keyTerms?.length > 0 && (
          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Key terms</h3>
            <div className="space-y-2">
              {content.keyTerms.map((kt: any, ki: number) => (
                <p key={ki} className="text-sm text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">{kt.term}: </span>{kt.definition}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-sm">{label}</div>;
}
