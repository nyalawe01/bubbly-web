import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/googleAuth";
import { streamChat, summarizePagePrompt, type ChatMessage } from "@/lib/api";
import { extractPageText } from "@/lib/extractPage";
import "./App.css";

type ModelType = "instant" | "expert" | "vision";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <Centered>Loading…</Centered>;
  return session ? <Chat /> : <SignIn />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="centered">{children}</div>;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const { error } = await fn({ email, password });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="signin">
      <h1>bubbly</h1>
      <p className="muted">Sign in to ask questions about whatever you're reading.</p>
      <button className="btn btn-google" onClick={handleGoogle} disabled={busy}>
        Continue with Google
      </button>
      <div className="divider">or</div>
      <form onSubmit={handleEmailAuth} className="form">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <div className="error">{error}</div>}
        <button className="btn" type="submit" disabled={busy}>
          {mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <button className="link" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState<ModelType>("instant");
  const [pageBusy, setPageBusy] = useState(false);
  const [pendingContextNote, setPendingContextNote] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { pendingContext } = (await chrome.storage.session.get("pendingContext")) as {
        pendingContext?: { text: string; source: string; url: string };
      };
      if (pendingContext?.text) {
        await chrome.storage.session.remove("pendingContext");
        setInput(`About this selection:\n"${pendingContext.text.slice(0, 500)}"\n\n`);
        setPendingContextNote(`Selection from ${new URL(pendingContext.url).hostname}`);
      }
    })();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const runChat = async (text: string) => {
    const next = [...messages, { role: "user" as const, text }];
    setMessages([...next, { role: "ai", text: "" }]);
    setSending(true);
    try {
      const full = await streamChat({ message: text, history: next, modelType: model }, (chunk) => {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "ai", text: chunk };
          return copy;
        });
      });
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "ai", text: full.trim() || "…" };
        return copy;
      });
    } catch (e: any) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "ai", text: `Error: ${e.message}` };
        return copy;
      });
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setPendingContextNote(null);
    runChat(text);
  };

  const handleSummarizePage = async () => {
    setPageBusy(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab");
      const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractPageText });
      if (!result?.text) throw new Error("Couldn't read this page (it may be a restricted page like chrome:// or the Chrome Web Store).");
      await runChat(summarizePagePrompt(result.text));
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "ai", text: `Error: ${e.message}` }]);
    } finally {
      setPageBusy(false);
    }
  };

  return (
    <div className="chat">
      <header className="topbar">
        <span className="wordmark">bubbly</span>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>

      <div className="quick-actions">
        <button className="btn btn-sm" onClick={handleSummarizePage} disabled={pageBusy || sending}>
          {pageBusy ? "Reading page…" : "Summarize this page"}
        </button>
      </div>

      <div className="messages" ref={listRef}>
        {messages.length === 0 && <div className="empty">Ask a question, or summarize the page above.</div>}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role === "user" ? "bubble-user" : "bubble-ai"}`}>
            {m.text}
          </div>
        ))}
      </div>

      {pendingContextNote && <div className="context-note">{pendingContextNote}</div>}

      <div className="model-pills">
        {(["instant", "expert", "vision"] as const).map((m) => (
          <button key={m} className={`pill ${model === m ? "pill-active" : ""}`} onClick={() => setModel(m)}>
            {m[0].toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Message bubbly…"
          rows={2}
        />
        <button className="btn" onClick={handleSend} disabled={sending || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
