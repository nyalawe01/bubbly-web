import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Plus, X, MoreVertical, ArrowLeft, FileText, HardDrive, Globe, Send, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle, getExtensionRedirectUrl } from "@/lib/googleAuth";
import {
  streamChat,
  createChatSession,
  saveChatHistory,
  getChatSession,
  listChatSessions,
  type ChatMessage,
  type ChatSessionSummary,
} from "@/lib/chatSessions";
import { extractPageText } from "@/lib/extractPage";
import { listOpenTabs, activateAndExtractTab, type OpenTab, type AttachedTab } from "@/lib/tabAttach";
import { uploadFileToVault, uploadBlobToVault } from "@/lib/vaultUpload";
import { listDriveFiles, downloadDriveFileAsBlob, type DriveFile } from "@/lib/googleDrive";
import "./App.css";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <Centered>Loading…</Centered>;
  return session ? <Chat session={session} /> : <SignIn />;
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
      <OAuthSetupHint />
    </div>
  );
}

// One-time setup aid: Google sign-in silently falls through to the web app's
// login instead of completing (Supabase's redirect-URL allow-list rejects
// anything not explicitly listed, same failure mode hit with mobile/Expo Go
// earlier) until this exact URL is added to Supabase's Auth -> URL
// Configuration. Shown inline instead of just console.logged so it's
// findable without opening devtools.
function OAuthSetupHint() {
  const [copied, setCopied] = useState(false);
  const redirectUrl = getExtensionRedirectUrl();

  const copy = () => {
    navigator.clipboard.writeText(redirectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <details className="oauth-hint">
      <summary>Google sign-in not working?</summary>
      <p className="muted">
        Add this exact URL to Supabase &rarr; Authentication &rarr; URL Configuration &rarr; Redirect URLs,
        then try again:
      </p>
      <div className="redirect-url-row">
        <code>{redirectUrl}</code>
        <button type="button" className="link" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </details>
  );
}

function firstNameFrom(session: Session): string {
  const meta: Record<string, any> = session.user.user_metadata || {};
  const fullName: string = meta.full_name || meta.name || "";
  return fullName.trim().split(/\s+/)[0] || "";
}

type View = "chat" | "recents";
type AttachPanel = "menu" | "drive";

function Chat({ session }: { session: Session }) {
  const [view, setView] = useState<View>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [attachedTab, setAttachedTab] = useState<AttachedTab | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachPanel, setAttachPanel] = useState<AttachPanel>("menu");
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [tabsLoading, setTabsLoading] = useState(false);
  const [tabAttachBusy, setTabAttachBusy] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadedNames, setUploadedNames] = useState<string[]>([]);

  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState("");

  const [pendingContextNote, setPendingContextNote] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const attachContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const firstName = firstNameFrom(session);

  // Selection sent over from the "Ask bubbly about this" context menu
  // (background.ts stashes it in chrome.storage.session since there's no
  // direct channel from a context-menu click to a not-yet-open panel).
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (attachContainerRef.current && !attachContainerRef.current.contains(e.target as Node)) {
        setAttachOpen(false);
        setAttachPanel("menu");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const h = Math.min(textareaRef.current.scrollHeight, 120);
    textareaRef.current.style.height = `${h}px`;
  }, [input]);

  // The attached tab's content is folded into the request for every turn
  // while it stays attached (so follow-ups stay grounded in it), but the
  // UI/what's actually saved to chat_sessions.history keeps just the
  // clean question — otherwise anyone opening this chat on web/mobile
  // would see a wall of scraped page text as "their message."
  const buildRequestHistory = (uiHistory: ChatMessage[]): ChatMessage[] => {
    if (!attachedTab) return uiHistory;
    return uiHistory.map((m, i) =>
      i === uiHistory.length - 1 && m.role === "user"
        ? { ...m, text: `Context from the tab "${attachedTab.title}" (${attachedTab.url}):\n\n${attachedTab.text.slice(0, 12000)}\n\nQuestion: ${m.text}` }
        : m
    );
  };

  const persist = async (finalMessages: ChatMessage[]) => {
    try {
      if (!sessionId) {
        const row = await createChatSession(session.user.id, finalMessages[0]);
        setSessionId(row.id);
        await saveChatHistory(row.id, finalMessages);
      } else {
        await saveChatHistory(sessionId, finalMessages);
      }
    } catch {
      // Non-fatal — the chat still works locally even if a write fails.
    }
  };

  const runChat = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", text };
    const uiNext = [...messages, userMsg];
    setMessages([...uiNext, { role: "ai", text: "" }]);
    setSending(true);
    try {
      const requestHistory = buildRequestHistory(uiNext);
      const requestMessage = requestHistory[requestHistory.length - 1].text;
      const full = await streamChat({ message: requestMessage, history: requestHistory, modelType: "instant" }, (chunk) => {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "ai", text: chunk };
          return copy;
        });
      });
      const finalMessages: ChatMessage[] = [...uiNext, { role: "ai", text: full.trim() || "…" }];
      setMessages(finalMessages);
      await persist(finalMessages);
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

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setAttachedTab(null);
    setInput("");
  };

  const openRecents = () => setView("recents");

  const openPastSession = async (id: string) => {
    try {
      const row = await getChatSession(id);
      if (!row) return;
      setMessages(row.history || []);
      setSessionId(row.id);
      setAttachedTab(null);
      setView("chat");
    } catch {
      setView("chat");
    }
  };

  // --- Attach: tabs -------------------------------------------------------
  const openAttachMenu = async () => {
    const next = !attachOpen;
    setAttachOpen(next);
    setAttachPanel("menu");
    if (next) {
      setTabsLoading(true);
      try {
        setOpenTabs(await listOpenTabs());
      } finally {
        setTabsLoading(false);
      }
    }
  };

  const handleAttachTab = async (tab: OpenTab) => {
    setTabAttachBusy(true);
    try {
      const attached = await activateAndExtractTab(tab, extractPageText);
      setAttachedTab(attached);
      setAttachOpen(false);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "ai", text: `Error: ${e.message}` }]);
    } finally {
      setTabAttachBusy(false);
    }
  };

  // --- Attach: local files -------------------------------------------------
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setAttachOpen(false);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadFileToVault(file);
        setUploadedNames((prev) => [...prev, file.name]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "ai", text: `Error: ${err.message}` }]);
    } finally {
      setUploading(false);
    }
  };

  // --- Attach: Google Drive -------------------------------------------------
  const openDrivePanel = async () => {
    setAttachPanel("drive");
    setDriveError("");
    setDriveLoading(true);
    try {
      setDriveFiles(await listDriveFiles(""));
    } catch (e: any) {
      setDriveError(e.message);
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveFilePick = async (file: DriveFile) => {
    setAttachOpen(false);
    setAttachPanel("menu");
    setUploading(true);
    try {
      const blob = await downloadDriveFileAsBlob(file);
      await uploadBlobToVault(blob, file.name);
      setUploadedNames((prev) => [...prev, file.name]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "ai", text: `Error: ${e.message}` }]);
    } finally {
      setUploading(false);
    }
  };

  if (view === "recents") {
    return (
      <RecentsPanel
        userId={session.user.id}
        onBack={() => setView("chat")}
        onOpenSession={openPastSession}
        onSignOut={() => supabase.auth.signOut()}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="flex items-center justify-between px-3 h-[48px] border-b border-[var(--border)] flex-shrink-0">
        <button onClick={startNewChat} className="text-[15px] font-medium tracking-tight" style={{ fontFamily: "var(--font-display, inherit)" }}>
          bubbly
        </button>
        <div className="flex items-center gap-1">
          <button onClick={openRecents} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" aria-label="Recents">
            <MoreVertical size={16} />
          </button>
          <button onClick={() => window.close()} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4" ref={listRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-2">
            <h1 className="text-lg font-medium tracking-tight text-[var(--text-primary)]">
              Hello, {firstName || "there"}. How can I help you today?
            </h1>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]"
                  }`}
                >
                  {m.text || <Loader2 size={13} className="animate-spin" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingContextNote && <div className="px-3 pb-1 text-[11px] text-[var(--text-secondary)]">{pendingContextNote}</div>}

      <div className="px-3 pb-3 flex-shrink-0">
        {uploadedNames.length > 0 && (
          <div className="mb-2 text-[11px] text-[var(--text-secondary)]">
            {uploadedNames.length} file{uploadedNames.length > 1 ? "s" : ""} added to Vault
          </div>
        )}

        {/* Attached-tab bar — touches the composer directly below it. */}
        {attachedTab && (
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] border-b-0 rounded-t-[16px] px-3 py-2">
            {attachedTab.favIconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attachedTab.favIconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
            ) : (
              <Globe size={14} className="text-[var(--text-secondary)] flex-shrink-0" />
            )}
            <span className="flex-1 min-w-0 truncate text-[12px] text-[var(--text-primary)]">{attachedTab.title}</span>
            <button onClick={() => setAttachedTab(null)} className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] flex-shrink-0" aria-label="Detach tab">
              <X size={13} />
            </button>
          </div>
        )}

        <div
          className={`w-full bg-[var(--bg-card)] border border-[var(--border)] p-1.5 flex flex-col relative ${
            attachedTab ? "rounded-b-[22px]" : "rounded-[22px]"
          }`}
        >
          <div className="flex px-1.5 py-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message bubbly…"
              rows={1}
              className="flex-1 w-full bg-transparent outline-none py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-[13px] font-medium resize-none min-h-[32px] max-h-[120px] overflow-y-auto"
            />
          </div>

          <div className="flex items-center justify-between mt-0.5 px-1 pb-0.5">
            <div className="relative flex items-center" ref={attachContainerRef}>
              <button
                onClick={openAttachMenu}
                disabled={uploading || tabAttachBusy}
                className={`p-1.5 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-transform ${attachOpen ? "rotate-45" : ""}`}
                aria-label="Attach"
              >
                {uploading || tabAttachBusy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </button>

              {attachOpen && (
                <div className="absolute bottom-full left-0 mb-1.5 w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 z-50 shadow-2xl">
                  {attachPanel === "menu" ? (
                    <>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Open tabs</div>
                      <div className="max-h-40 overflow-y-auto">
                        {tabsLoading ? (
                          <div className="px-2 py-3 flex justify-center">
                            <Loader2 size={14} className="animate-spin text-[var(--text-secondary)]" />
                          </div>
                        ) : openTabs.length === 0 ? (
                          <div className="px-2 py-2 text-[11px] text-[var(--text-secondary)]">No other tabs open</div>
                        ) : (
                          openTabs.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => handleAttachTab(tab)}
                              className="w-full flex items-center gap-2 p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[12px] text-left"
                            >
                              {tab.favIconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={tab.favIconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
                              ) : (
                                <Globe size={14} className="text-[var(--text-secondary)] flex-shrink-0" />
                              )}
                              <span className="truncate">{tab.title}</span>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="h-px my-1 mx-1 bg-[var(--border)]" />

                      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                      <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[12px]">
                        <FileText size={14} className="text-[var(--text-secondary)]" /> Upload File
                      </button>
                      <button onClick={openDrivePanel} className="w-full flex items-center gap-2 p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[12px]">
                        <HardDrive size={14} className="text-[var(--text-secondary)]" /> Google Drive
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setAttachPanel("menu")} className="w-full flex items-center gap-2 p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[12px] font-medium mb-1">
                        <ArrowLeft size={14} /> Google Drive
                      </button>
                      <div className="max-h-48 overflow-y-auto">
                        {driveLoading ? (
                          <div className="px-2 py-3 flex justify-center">
                            <Loader2 size={14} className="animate-spin text-[var(--text-secondary)]" />
                          </div>
                        ) : driveError ? (
                          <div className="px-2 py-2 text-[11px] text-red-400">{driveError}</div>
                        ) : driveFiles.length === 0 ? (
                          <div className="px-2 py-2 text-[11px] text-[var(--text-secondary)]">No files found</div>
                        ) : (
                          driveFiles.map((f) => (
                            <button key={f.id} onClick={() => handleDriveFilePick(f)} className="w-full flex items-center gap-2 p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[12px] text-left">
                              <FileText size={14} className="text-[var(--text-secondary)] flex-shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="p-2 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-40"
              aria-label="Send"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentsPanel({
  userId,
  onBack,
  onOpenSession,
  onSignOut,
}: {
  userId: string;
  onBack: () => void;
  onOpenSession: (id: string) => void;
  onSignOut: () => void;
}) {
  const [recents, setRecents] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listChatSessions(userId)
      .then(setRecents)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="flex items-center gap-2 px-3 h-[48px] border-b border-[var(--border)] flex-shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <span className="text-[13px] font-semibold">Recents</span>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={16} className="animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : recents.length === 0 ? (
          <div className="px-3 py-4 text-[12px] text-[var(--text-secondary)]">No chats yet.</div>
        ) : (
          recents.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpenSession(r.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] text-[13px] truncate block"
            >
              {r.title}
            </button>
          ))
        )}
      </div>

      <div className="border-t border-[var(--border)] p-2 flex-shrink-0">
        <button onClick={onSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-400 hover:bg-[var(--bg-hover)] rounded-lg">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}
