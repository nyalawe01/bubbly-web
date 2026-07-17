"use client";
import { useState } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface QMsg {
  role: "user" | "ai";
  text: string;
}

interface QuestionChatProps {
  // Answer-key context for THIS question, sent to the tutor.
  ctx: { question: string; options?: string[]; correctAnswer?: string; studentAnswer?: string; explanation?: string };
  thread: QMsg[];
  onUpdate: (thread: QMsg[]) => void;
}

/** Per-question tutoring chat. Saved inside the asset (state.qchats[qid]) — never in
 *  global chat history — so reopening the asset shows past explanations per question. */
export function QuestionChat({ ctx, thread, onUpdate }: QuestionChatProps) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput("");
    const next: QMsg[] = [...thread, { role: "user", text: msg }];
    onUpdate(next);
    setBusy(true);
    try {
      const res = await fetch("/api/notebook/qchat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ctx, history: thread, message: msg }),
      });
      const data = await res.json();
      onUpdate([...next, { role: "ai", text: data.reply || data.error || "…" }]);
    } catch {
      onUpdate([...next, { role: "ai", text: "Something went wrong — try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-3">
      <div className="text-xs font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
        <Sparkles size={13} /> Ask bubbly about this question
      </div>
      {thread.length > 0 && (
        <div className="space-y-2 mb-2 max-h-72 overflow-y-auto hide-scrollbar">
          {thread.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div
                className={`inline-block text-sm rounded-xl px-3 py-2 max-w-[90%] text-left ${
                  m.role === "user" ? "bg-[var(--accent-soft)] text-[var(--text-primary)]" : "bg-[var(--bg-input)] text-[var(--text-primary)]"
                }`}
              >
                {m.role === "user" ? (
                  m.text
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none ai-prose">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="e.g. explain why, give an example…"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] disabled:opacity-50 flex-shrink-0"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}
