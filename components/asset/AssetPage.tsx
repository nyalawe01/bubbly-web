"use client";
import { useEffect, useRef, useState } from "react";
import { X, BrainCircuit, MonitorPlay, ImageIcon, FileText, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuizRunner } from "./QuizRunner";
import { ExamRunner } from "./ExamRunner";
import { FlashcardPanel, SlidePanel, SummaryPanel } from "./AssetPanels";

interface AssetPageProps {
  asset: any; // { id, type, title, content, state, status }
  onBack: () => void;
  onPersist: (patch: { state?: any; content?: any }) => void;
}

/** A generated asset rendered as a full page in the chat area (not a popup). Quiz/exam
 *  get the interactive runner; other types get their panel plus an edit/review chat. */
export function AssetPage({ asset, onBack, onPersist }: AssetPageProps) {
  const [state, setState] = useState<any>(asset.state || {});
  const [content, setContent] = useState<any>(asset.content);
  const persistTimer = useRef<any>(null);

  useEffect(() => {
    setState(asset.state || {});
    setContent(asset.content);
  }, [asset.id]);

  // Debounced so per-question chat typing / rapid answers don't spam the DB.
  const persistState = (next: any) => {
    setState(next);
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => onPersist({ state: next }), 600);
  };
  const persistContent = (next: any) => {
    setContent(next);
    onPersist({ content: next });
  };

  const type = asset.type;
  const isInteractive = type === "quiz" || type === "exam";
  const icon =
    type === "quiz" || type === "exam" ? <BrainCircuit size={18} /> : type === "slides" ? <MonitorPlay size={18} /> : type === "flashcards" ? <ImageIcon size={18} /> : <FileText size={18} />;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 h-[52px] border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-[var(--bg-input)] text-[var(--text-secondary)]">{icon}</div>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-semibold text-[var(--text-primary)] truncate">{asset.title}</h2>
            <p className="text-[10px] md:text-xs text-[var(--text-secondary)] capitalize">{type}</p>
          </div>
        </div>
        <button onClick={onBack} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]" aria-label="Back to chat">
          <X size={20} />
        </button>
      </div>

      {type === "quiz" ? (
        <QuizRunner content={content} state={state} onState={persistState} />
      ) : type === "exam" ? (
        <ExamRunner content={content} state={state} onState={persistState} />
      ) : type === "flashcards" ? (
        <FlashcardPanel content={content} />
      ) : type === "slides" ? (
        <SlidePanel content={content} />
      ) : (
        <SummaryPanel content={content} />
      )}

      {!isInteractive && <AssetChat type={type} content={content} state={state} onState={persistState} onContent={persistContent} />}
    </div>
  );
}

function AssetChat({ type, content, state, onState, onContent }: { type: string; content: any; state: any; onState: (s: any) => void; onContent: (c: any) => void }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const thread: { role: string; text: string }[] = state.assetChat || [];

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput("");
    setOpen(true);
    const next = [...thread, { role: "user", text: msg }];
    onState({ ...state, assetChat: next });
    setBusy(true);
    try {
      const res = await fetch("/api/notebook/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, history: thread, message: msg }),
      });
      const data = await res.json();
      onState({ ...state, assetChat: [...next, { role: "ai", text: data.reply || data.error || "…" }] });
      if (data.updatedContent) onContent(data.updatedContent);
    } catch {
      onState({ ...state, assetChat: [...next, { role: "ai", text: "Something went wrong — try again." }] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-[var(--border)] flex-shrink-0">
      {open && thread.length > 0 && (
        <div className="max-h-52 overflow-y-auto hide-scrollbar p-3 space-y-2">
          {thread.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div className={`inline-block text-sm rounded-xl px-3 py-2 max-w-[85%] text-left ${m.role === "user" ? "bg-[var(--accent-soft)]" : "bg-[var(--bg-input)]"} text-[var(--text-primary)]`}>
                {m.role === "user" ? m.text : <div className="prose prose-sm dark:prose-invert max-w-none ai-prose"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown></div>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] px-3">
          <Sparkles size={15} className="text-[var(--text-secondary)]" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={`Ask to review or edit this ${type}…`}
            className="flex-1 bg-transparent py-2.5 text-sm outline-none text-[var(--text-primary)]"
          />
        </div>
        <button onClick={send} disabled={busy || !input.trim()} className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] disabled:opacity-50 flex-shrink-0">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
