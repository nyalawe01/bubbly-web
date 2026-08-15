"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import Head from "next/head";
import { 
  Loader2, 
  Menu,
  Search
} from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatView } from "@/components/chat/ChatView";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { SearchModal } from "@/components/modals/SearchModal";
import { QuizModal } from "@/components/modals/QuizModal";
import { FlashcardModal } from "@/components/modals/FlashcardModal";
import { SlidesModal } from "@/components/modals/SlidesModal";
import { SummaryModal } from "@/components/modals/SummaryModal";
import { ExamModal } from "@/components/modals/ExamModal";
import { SourcesModal } from "@/components/modals/SourcesModal";
import { FilePreviewModal } from "@/components/ui/FilePreviewModal";
import { AssetViewer } from "@/components/modals/AssetViewer";
import { SourceViewerModal } from "@/components/modals/SourceViewerModal";
import { StudyPlanViewer } from "@/components/modals/StudyPlanViewer";
import { NewTaskModal } from "@/components/modals/NewTaskModal";
import { useTheme } from "@/components/theme/ThemeProvider";
import { uploadFilesToVault } from "@/lib/api/vaultUpload";
import { downloadChatMarkdown, downloadBlobResponse } from "@/lib/exportChat";
import { AssetPage } from "@/components/asset/AssetPage";
import { RecentActivityMobile } from "@/components/ui/RecentActivityMobile";

// CSS Styles
const customStyles = `
  @keyframes thinkingRotate {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.2); }
    100% { transform: rotate(360deg) scale(1); }
  }
  .thinking-dots { animation: thinkingRotate 1.5s ease-in-out infinite; }

  @keyframes glowLeft {
    0% { left: -100%; }
    100% { left: 100%; }
  }
  @keyframes glowRight {
    0% { right: -100%; }
    100% { right: 100%; }
  }
  .glow-line-left { animation: glowLeft 3s linear infinite; }
  .glow-line-right { animation: glowRight 3s linear infinite; }

  @keyframes blobFloat {
    0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
    33% { transform: translate(30px, -50px) scale(1.1) rotate(120deg); }
    66% { transform: translate(-20px, 20px) scale(0.9) rotate(240deg); }
    100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
  }
  .blob-animation { animation: blobFloat 40s ease-in-out infinite; }
  .blob-animation-2 { animation: blobFloat 50s ease-in-out infinite reverse; }
  .blob-animation-3 { animation: blobFloat 60s ease-in-out infinite 5s; }

  .hide-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
  .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
  .notebook-scroll::-webkit-scrollbar { width: 3px; }
  .notebook-scroll::-webkit-scrollbar-thumb { background-color: rgba(150, 150, 150, 0.2); border-radius: 4px; }
  .perspective-1000 { perspective: 1000px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
  .video-transition { transition: opacity 0.5s ease-in-out; }
  *[role="button"], button, a, [onClick] { cursor: pointer; }
  @keyframes pulse-ring {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
  .recording-pulse { animation: pulse-ring 1.5s infinite; }
`;

// Maps a Supabase chat_sessions row to the shape the UI already expects
// (timestamp/date derived from updated_at so Recents' date-bucketing keeps working).
function mapChatRow(row: any) {
  const t = new Date(row.updated_at || row.created_at).getTime();
  return { id: row.id, title: row.title, pinned: row.pinned, history: row.history, timestamp: t, date: new Date(t).toLocaleDateString() };
}

export default function Workspace() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ============================================
  // STATE
  // ============================================
  const { theme, colors } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("chat");
  const [currentTabTitle, setCurrentTabTitle] = useState("New Chat");

  // Modal States
  const [activeModal, setActiveModal] = useState<
    "settings" | "quiz" | "flashcards" | "slides" | "summary" | "exam" | "sources" | "filePreview" | "assetViewer" | "sourceViewer" | "studyPlanViewer" | "search" | "generating" | "newTask" | null
  >(null);
  const [settingsTab, setSettingsTab] = useState<"general" | "profile" | "data" | "about">("general");
  const [modalData, setModalData] = useState<any>(null);

  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showAuthScreen, setShowAuthScreen] = useState(true);
  const [user, setUser] = useState({ name: "Loading...", email: "", avatar_url: "", accessToken: "", id: "", improveModel: false });
  const [isIncognito, setIsIncognito] = useState(false);

  // Chat
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [savedChats, setSavedChats] = useState<any[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<"instant" | "expert" | "vision">("instant");
  const [showModelPills, setShowModelPills] = useState(true);
  // MENTOR MODE question form: the AI can raise a [QUESTIONS] block; we pop it up as a
  // modal, and track which question-messages have already been answered (by message id)
  // so the "answer" affordance survives the message-list rebuilds during streaming.
  const [questionsModal, setQuestionsModal] = useState<{ id: string; intro?: string; questions: any[] } | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});
  // Generated Notebook assets live in Supabase now (background generation, durable
  // quiz progress/scores + per-question chats). activeAssetId opens one as a page.
  const [notebookAssets, setNotebookAssets] = useState<any[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

  // Vault
  const [vaultDocuments, setVaultDocuments] = useState<any[]>([]);
  const [vaultCategories, setVaultCategories] = useState<Record<string, any[]>>({ "Uncategorized": [] });

  // Audio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const uploadPopupRef = useRef<HTMLDivElement>(null);
  const vaultUploadRef = useRef<HTMLDivElement>(null);

  // ============================================
  // THEME (see components/theme/ThemeProvider.tsx — theme/colors sourced above)
  // ============================================
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only two logo asset variants exist (dark vs. light-surfaced); every
  // non-dark theme (white/pink/blue/green/grey) is light-surfaced, so they all
  // share the light asset.
  const logoSrc = theme === "dark" ? "/logo.png" : "/logo2.png";

  // ============================================
  // SAVED CHATS
  // ============================================
  // Chats are now account-based (Supabase chat_sessions, loaded in loadUserData)
  // instead of browser-scoped localStorage — see mapChatRow + the one-time legacy
  // import above. Each explicit action (send/rename/pin/delete) writes directly
  // to Supabase at its own call site rather than via a blanket auto-save effect.

  useEffect(() => {
    if (messages.length === 0 && !currentChatId) {
      setShowModelPills(true);
    } else {
      setShowModelPills(false);
    }
  }, [messages, currentChatId]);

  // savedChats is chat_sessions rows only now — Notebook assets live entirely in
  // their own Supabase table/state (notebookAssets, below), never mixed in here.
  const standardChats = savedChats;

  const categorizedChats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;
    // Pinned first (its own bucket, object key order = render order), then the
    // usual date buckets for everything else.
    const cats: Record<string, any[]> = { Pinned: [], Today: [], Yesterday: [], "Previous 7 Days": [], Older: [] };

    standardChats.forEach(chat => {
      if (chat.pinned) { cats.Pinned.push(chat); return; }
      const chatTime = chat.timestamp || new Date(chat.date).getTime() || Date.now();
      if (chatTime >= today) cats.Today.push(chat);
      else if (chatTime >= yesterday) cats.Yesterday.push(chat);
      else if (chatTime >= weekAgo) cats["Previous 7 Days"].push(chat);
      else cats.Older.push(chat);
    });
    return cats;
  }, [standardChats]);

  // ============================================
  // AUTH FUNCTIONS
  // ============================================
  // All login/sign-up UI lives on /login (single auth surface). This page only
  // handles Google Drive re-auth for the Drive picker, and sign-out.

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email profile https://www.googleapis.com/auth/drive.readonly',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google Drive re-auth failed:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowAuthScreen(true); setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action is IRREVERSIBLE and all your data will be permanently deleted.")) return;
    if (!confirm("Please confirm again: This will delete all your chats, files, and personal data.")) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete account');

      localStorage.removeItem('bubbly_vault_conversations');
      localStorage.removeItem('studix_vault_conversations');
      localStorage.removeItem('studix_theme');

      alert("Account successfully deleted.");
      handleSignOut();
    } catch (error: any) {
      alert("Failed to delete account: " + error.message);
    }
  };

  const deleteAllData = async () => {
    if (!confirm("Are you sure you want to delete ALL your data? This includes all chats, files, and documents. This action is IRREVERSIBLE.")) return;
    
    try {
      await supabase.from('vault_documents').delete().eq('user_id', user.id);
      await supabase.from('vault_embeddings').delete().eq('user_id', user.id);

      localStorage.removeItem('bubbly_vault_conversations');
      localStorage.removeItem('studix_vault_conversations');

      setSavedChats([]);
      setVaultDocuments([]);
      setMessages([]);
      setCurrentChatId(null);
      
      alert("All data successfully deleted.");
    } catch (error: any) {
      alert("Failed to delete data: " + error.message);
    }
  };

  // Matches mobile's handleDeleteAllChats (SettingsSheet.tsx) — chat_sessions only,
  // distinct from deleteAllData above (which clears Vault documents/embeddings).
  const handleDeleteAllChats = async () => {
    if (!confirm("Delete all your chats? This action is irreversible.")) return;
    try {
      const { error } = await supabase.from("chat_sessions").delete().eq("user_id", user.id);
      if (error) throw error;
      setSavedChats([]);
      setMessages([]);
      setCurrentChatId(null);
      alert("All chats deleted.");
    } catch (error: any) {
      alert("Failed to delete chats: " + error.message);
    }
  };

  const exportAccountData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/account/export", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (!res.ok) throw new Error((await res.json()).error || "Export failed");
      const text = await res.text();
      downloadBlobResponse(`bubbly-data-export-${user.id}.json`, text);
    } catch (error: any) {
      alert("Failed to export data: " + error.message);
    }
  };

  const updateUserFromSession = (session: any) => {
    if (!session?.user) return;
    const userData = session.user;
    const metadata = userData.user_metadata || {};
    const identities = userData.identities || [];
    
    const displayName = metadata.full_name || metadata.name || (metadata.first_name ? `${metadata.first_name} ${metadata.last_name || ''}`.trim() : userData.email?.split('@')[0]) || "User";
    let avatarUrl = metadata.avatar_url || metadata.picture || metadata.photo_url || "";
    if (!avatarUrl && identities.length > 0) {
      const googleIdentity = identities.find((id: any) => id.provider === 'google');
      if (googleIdentity?.identity_data?.avatar_url) avatarUrl = googleIdentity.identity_data.avatar_url;
    }
    setUser({
      name: displayName,
      email: userData.email || "",
      avatar_url: avatarUrl || "",
      accessToken: session.provider_token || "",
      id: userData.id || "",
      improveModel: !!metadata.improve_model,
    });
  };

  // "Improve the model for everyone" toggle (Settings > Data) — a training-consent
  // preference only, stored on user_metadata next to onboarding/profile fields.
  // No training pipeline exists yet; this just records the user's choice for if/when
  // one does (see the Privacy Policy's "Improve the model for everyone" section).
  const setImproveModel = async (value: boolean) => {
    setUser((u) => ({ ...u, improveModel: value })); // optimistic
    const { error } = await supabase.auth.updateUser({ data: { improve_model: value } });
    if (error) {
      setUser((u) => ({ ...u, improveModel: !value })); // rollback
      alert("Failed to save preference: " + error.message);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) { 
        setIsAuthenticated(true); 
        setShowAuthScreen(false); 
        setIsLoadingAuth(false);
        updateUserFromSession(session);
      } 
      else if (event === 'SIGNED_OUT') { setIsAuthenticated(false); setShowAuthScreen(true); setIsLoadingAuth(false); }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) { 
        setIsAuthenticated(true); 
        setShowAuthScreen(false); 
        setIsLoadingAuth(false); 
        updateUserFromSession(session);
        loadUserData(session.user.id);
      }
      else { setIsAuthenticated(false); setShowAuthScreen(true); setIsLoadingAuth(false); }
    });
    return () => { isMounted = false; subscription.unsubscribe(); };
  }, [supabase]);

  // Single auth surface: unauthenticated users are sent to /login, where the one
  // login/sign-up form lives. No embedded auth UI here.
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      window.location.replace("/login");
    }
  }, [isLoadingAuth, isAuthenticated]);

  const loadUserData = async (userId: string) => {
    const { data: chats } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (chats && chats.length > 0) {
      setSavedChats(chats.map(mapChatRow));
    } else {
      // One-time import: this account has no Supabase-backed chats yet, but this
      // browser/origin may still have old localStorage history (chats were
      // browser-scoped before this migration, so switching domains — e.g. moving
      // from local dev to the production URL — made history "disappear"). Import
      // it once so it isn't silently stranded, then stop relying on localStorage.
      const legacy = localStorage.getItem('bubbly_vault_conversations') || localStorage.getItem('studix_vault_conversations');
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy).filter((c: any) => !c.isNotebookAsset && c.history?.length);
          if (parsed.length > 0) {
            const rows = parsed.map((c: any) => ({
              user_id: userId,
              title: c.title || 'Untitled chat',
              pinned: !!c.pinned,
              history: c.history,
              created_at: c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString(),
              updated_at: c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString(),
            }));
            const { data: imported } = await supabase.from('chat_sessions').insert(rows).select();
            if (imported) setSavedChats(imported.map(mapChatRow).sort((a, b) => b.timestamp - a.timestamp));
          }
        } catch (e) {
          console.warn('Legacy chat import failed (non-fatal):', e);
        }
        localStorage.removeItem('bubbly_vault_conversations');
        localStorage.removeItem('studix_vault_conversations');
      }
    }

    const { data } = await supabase.from('vault_documents').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) {
      setVaultDocuments(data.map(d => ({
        id: d.id,
        name: d.file_name,
        size: d.file_size,
        type: d.file_type,
        date: new Date(d.created_at).toLocaleDateString(),
        aiSummary: d.ai_summary
      })));
    }

    const { data: assets } = await supabase
      .from('notebook_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (assets) setNotebookAssets(assets);
  };

  // Live-sync notebook assets so a generating asset flips to ready (or failed)
  // without a refresh, and edits from another tab appear here too.
  useEffect(() => {
    if (!user.id) return;
    const channel = supabase
      .channel(`notebook_assets_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notebook_assets", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          setNotebookAssets((prev) => {
            if (payload.eventType === "DELETE") return prev.filter((a) => a.id !== payload.old.id);
            const row = payload.new;
            return prev.some((a) => a.id === row.id) ? prev.map((a) => (a.id === row.id ? row : a)) : [row, ...prev];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase]);

  // ============================================
  // GOOGLE DRIVE FUNCTIONS
  // ============================================
  const launchGoogleDrivePicker = async () => {
    if (!user.accessToken) {
      // No Google Drive session yet (e.g. signed up with email/password, or before
      // Drive was added) — take them to grant access, then they can pick files.
      alert("Connect your Google Drive to attach files from it. You'll be sent to grant access.");
      await handleGoogleSignIn();
      return;
    }

    try {
      if (typeof window !== 'undefined' && !(window as any).google) {
        const script = document.createElement('script');
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => (window as any).gapi.load('picker', () => {});
        document.body.appendChild(script);
        return;
      }

      if (!(window as any).google?.picker) {
        alert("Google API is still loading...");
        return;
      }

      const picker = new (window as any).google.picker.PickerBuilder()
        .addView((window as any).google.picker.ViewId.DOCS)
        .setOAuthToken(user.accessToken)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!)
        .setCallback((data: any) => {
          if (data.action === (window as any).google.picker.Action.PICKED) {
            const file = data.docs[0];
            handleGoogleDriveFile(file);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (error) {
      console.error('Google Drive picker error:', error);
      alert('Failed to open Google Drive. Please try again.');
    }
  };

  const handleGoogleDriveFile = async (file: any) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );

      // Token doesn't have Drive access (e.g. an account made before Drive was
      // added, or a session without the Drive scope) — take them to grant it.
      if (response.status === 401 || response.status === 403) {
        alert("bubbly needs permission to read your Google Drive. You'll be sent to grant access.");
        await handleGoogleSignIn();
        return;
      }
      if (!response.ok) throw new Error(`Drive download failed (${response.status})`);

      const blob = await response.blob();
      const driveFile = new File([blob], file.name, { type: blob.type });
      setAttachedFiles(prev => [...prev, driveFile]);
    } catch (error) {
      console.error('Failed to download Google Drive file:', error);
      alert('Failed to download file from Google Drive.');
    }
  };

  // ============================================
  // CHAT FUNCTIONS
  // ============================================
  const startNewChat = () => {
    setActiveView("chat");
    setActiveAssetId(null);
    setMessages([]);
    setCurrentChatId(null);
    setAttachedFiles([]);
    setShowModelPills(true);
    setIsIncognito(false);
    if (window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  // Modeled on ChatGPT's Temporary Chat. Lives as a toggle directly on the
  // composer (not a separate Sidebar entry point) — flipping it always starts
  // a genuinely fresh conversation in the new mode, since incognito can only
  // ever apply from message 1 (there's no way to retroactively make
  // already-persisted messages incognito, or vice versa). While active,
  // handleSendMessage never creates/updates a chat_sessions row or adds the
  // conversation to Recents, and the server (api/chat) skips the
  // semantic-cache read/write for this turn — see the `incognito` flag below.
  const toggleIncognito = () => {
    const next = !isIncognito;
    startNewChat();
    setIsIncognito(next);
  };

  const loadChat = (item: any) => {
    setActiveView("chat");
    setActiveAssetId(null);
    setIsIncognito(false);
    const chat = savedChats.find(c => c.id === item.id || c.id === item);
    if (chat) {
      setMessages(chat.history || []);
      setCurrentChatId(chat.id);
      setShowModelPills(false);
      if (window.innerWidth < 768) setIsMobileMenuOpen(false);
    }
  };

  // Row-menu actions for chat history (Recents) — each writes through to
  // Supabase (chat_sessions) immediately, fire-and-forget, so it's account-based
  // rather than tied to this one browser.
  const toggleChatPin = (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    const nextPinned = !chat?.pinned;
    setSavedChats(prev => prev.map(c => (c.id === chatId ? { ...c, pinned: nextPinned } : c)));
    supabase.from('chat_sessions').update({ pinned: nextPinned }).eq('id', chatId).then(() => {}, () => {});
  };

  const renameChat = (chatId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSavedChats(prev => prev.map(c => (c.id === chatId ? { ...c, title: trimmed } : c)));
    supabase.from('chat_sessions').update({ title: trimmed }).eq('id', chatId).then(() => {}, () => {});
  };

  const deleteChat = (chatId: string) => {
    setSavedChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) startNewChat();
    supabase.from('chat_sessions').delete().eq('id', chatId).then(() => {}, () => {});
  };

  const shareChat = (chat: any) => {
    const text = (chat.history || [])
      .map((m: any) => `${m.role === "user" ? "You" : "bubbly"}: ${m.text}`)
      .join("\n\n");
    if (navigator.share) {
      navigator.share({ title: chat.title || "bubbly chat", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Conversation copied to clipboard!"));
    }
  };

  const exportChat = (chat: any) => downloadChatMarkdown(chat);

  const handleModelSelect = (model: "instant" | "expert" | "vision") => {
    setSelectedModel(model);
  };

  // Chat history is stored in JSONB — raw browser File objects serialize to `{}`
  // and would otherwise come back as nameless dead pills after reload. Persist only
  // the metadata each pill needs to render (and drop the large pastedText payload).
  const sanitizeForStorage = (msgs: any[]) =>
    msgs.map((m) =>
      m?.files?.length
        ? { ...m, files: m.files.map((f: any) => ({ name: f.name || "Attachment", type: f.type || "", size: f.size || 0 })) }
        : m
    );

  // Index any newly-attached files through the shared ingestion pipeline so the AI
  // can actually read them (Phase 1 P0). Runs reactively on attach; reused for the
  // "immediately indexing" thumbnail state in ChatInput. Pasted-as-text skips the
  // network round-trip (its content is already in hand).
  useEffect(() => {
    const toIndex = attachedFiles.filter(
      (f) => f?.processedContent == null && !f?.indexing && (f.raw || f instanceof File)
    );
    if (!toIndex.length) return;

    toIndex.forEach(async (f) => {
      // Pasted-as-attachment already carries its text — no need to re-OCR it.
      if (typeof f?.pastedText === "string" && f.pastedText.length > 0) {
        setAttachedFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, processedContent: f.pastedText } : x)));
        return;
      }

      setAttachedFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, indexing: true } : x)));
      try {
        const form = new FormData();
        form.append("file", f.raw || f);
        const res = await fetch("/api/chat/attachments/process", { method: "POST", body: form });
        const data = await res.json();
        setAttachedFiles((prev) =>
          prev.map((x) =>
            x.id === f.id
              ? {
                  ...x,
                  indexing: false,
                  processedContent: data.content || undefined,
                  processedError: data.error ? String(data.error) : undefined,
                }
              : x
          )
        );
      } catch {
        setAttachedFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, indexing: false, processedError: "indexing failed" } : x)));
      }
    });
  }, [attachedFiles]);

  const handleSendMessage = async (e?: React.FormEvent, historicalPrompt?: string, historyOverride?: any[]) => {
    e?.preventDefault();
    const activeText = historicalPrompt || inputText;
    if ((!activeText.trim() && attachedFiles.length === 0) || isGenerating) return;

    const currentFiles = [...attachedFiles];
    // Assemble the already-extracted content the AI will ground on. Any file still
    // indexing gets indexed inline right now so a fast Send never drops content.
    const attachment_context: any[] = [];
    for (const f of currentFiles) {
      if (f.processedContent != null && typeof f.processedContent === "string" && f.processedContent.length > 0) {
        attachment_context.push({ file_name: f.name, file_type: f.type, content: f.processedContent });
      } else {
        // Inline fallback: index synchronously before sending.
        setAttachedFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, indexing: true } : x)));
        try {
          const form = new FormData();
          form.append("file", f.raw || f);
          const res = await fetch("/api/chat/attachments/process", { method: "POST", body: form });
          const data = await res.json();
          if (data.content) {
            attachment_context.push({ file_name: f.name, file_type: f.type, content: data.content });
            setAttachedFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, processedContent: data.content, indexing: false } : x)));
          } else {
            setAttachedFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, indexing: false } : x)));
          }
        } catch {
          setAttachedFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, indexing: false } : x)));
        }
      }
    }

    // historyOverride lets callers (edit, regenerate) hand us the EXACT prior
    // history to build on — using the `messages` state closure directly here would
    // be stale the instant a caller has just called setMessages() itself.
    const baseMessages = historyOverride ?? messages;
    const incomingMessages = [
      ...baseMessages,
      {
        role: "user",
        text: activeText.trim(),
        files: currentFiles.length > 0 ? currentFiles : undefined,
      },
    ];
    setMessages(incomingMessages);
    if (!historicalPrompt) setInputText("");
    setAttachedFiles([]);
    setIsGenerating(true);
    setShowModelPills(false);

    let workingChatId = currentChatId;
    if (!workingChatId) {
      workingChatId = `chat_${Date.now()}`;
      setCurrentChatId(workingChatId);

      // Incognito: never touches chat_sessions and never joins Recents — the
      // conversation lives only in this component's state for the rest of the
      // session, matching an actual incognito browser tab.
      if (!isIncognito) {
        // Instant fallback title (truncated raw text) so the chat appears in Recents
        // immediately; replaced moments later by an AI-simplified title (below) —
        // never blocks sending the message.
        const fallbackTitle = activeText.length > 40 ? activeText.slice(0, 40) + "…" : activeText;
        const { data: row } = await supabase
          .from('chat_sessions')
          .insert({ user_id: user.id, title: fallbackTitle, history: sanitizeForStorage(incomingMessages) })
          .select()
          .single();
        // Falls back to a local-only id if the insert fails transiently, so the
        // turn can still proceed — it just won't persist across reloads this time.
        workingChatId = row?.id || workingChatId;
        setCurrentChatId(workingChatId);
        const newChat = row ? mapChatRow(row) : { id: workingChatId, title: fallbackTitle, pinned: false, date: new Date().toLocaleDateString(), timestamp: Date.now(), history: incomingMessages };
        setSavedChats(prev => [newChat, ...prev]);

        if (row) {
          const titleChatId = workingChatId;
          fetch("/api/chat/title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: activeText }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (!d.title) return;
              setSavedChats(prev => prev.map(c => (c.id === titleChatId ? { ...c, title: d.title } : c)));
              supabase.from('chat_sessions').update({ title: d.title }).eq('id', titleChatId).then(() => {}, () => {});
            })
            .catch(() => {}); // fallback title stands if this fails
        }
      }
    } else if (!isIncognito) {
      setSavedChats(prev => prev.map(c => c.id === workingChatId ? { ...c, history: incomingMessages, timestamp: Date.now() } : c));
      // No Supabase write here — the single write after the AI reply completes
      // (below) covers both this user message and the reply in one round-trip.
    }

    // Tracks the latest full message list through the stream so a single Supabase
    // write can happen once, after the reply finishes, instead of on every chunk.
    let finalMessages = incomingMessages;

    try {
      // Pass the pill straight through: "instant" -> Groq (fast), "expert" ->
      // DeepSeek (deep), "vision" -> Gemini. The server (chatModelFor) maps it.
      //
      // These two flags are fast-paths that let the server skip the intent classifier.
      // Keep them TIGHT: an over-broad diagram regex used to swallow image requests
      // (e.g. "draw an image of a dog" matched "draw" -> forced diagram mode -> no image).
      // Only unambiguous phrasing forces a mode here; everything else falls through to the
      // Groq router, which distinguishes image vs diagram vs plain chat on its own.
      const wantsImage =
        /\b(image|picture|photo|portrait|painting|drawing|wallpaper|illustration)\b/i.test(activeText) &&
        /\b(generate|create|make|draw|design|show|give)\b/i.test(activeText);
      const needsDiagram =
        !wantsImage && /\b(diagram|flow ?chart|org ?chart|mind ?map)\b/i.test(activeText);

      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: activeText.trim(),
          history: baseMessages,
          modelType: selectedModel,
          files: currentFiles,
          attachment_context,
          generateImage: wantsImage,
          generateDiagram: needsDiagram,
          incognito: isIncognito,
          context: { documents: vaultDocuments.map(d => d.name), files: currentFiles.map(f => f.name) },
        }),
      });
      if (!response.ok) throw new Error("Connection dropped.");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const aiMessageId = `ai_${Date.now()}`;
      let streamAccumulator = "";
      let diagramData = null;
      let imageData = null;
      let sources: any[] = [];
      let questionsData: any = null;

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          // The server can append more than one trailing tag back-to-back with no
          // await between them (e.g. [IMAGE]{...}[SOURCES]{...}), so a single
          // network read can legitimately contain multiple tags at once. Scan for
          // ALL marker positions in this chunk instead of treating them as mutually
          // exclusive — otherwise only the first tag found would parse and the rest
          // would leak into the visible text as raw JSON.
          const TAG_MARKERS = ['[DIAGRAM]', '[QUESTIONS]', '[IMAGE]', '[SOURCES]'];
          const foundTags = TAG_MARKERS
            .map((marker) => ({ marker, index: chunk.indexOf(marker) }))
            .filter((t) => t.index !== -1)
            .sort((a, b) => a.index - b.index);

          if (foundTags.length === 0) {
            streamAccumulator += chunk;
          } else {
            streamAccumulator += chunk.slice(0, foundTags[0].index);
            foundTags.forEach((tag, i) => {
              const start = tag.index + tag.marker.length;
              const end = i + 1 < foundTags.length ? foundTags[i + 1].index : chunk.length;
              const payload = chunk.slice(start, end).trim();
              try {
                const parsed = payload ? JSON.parse(payload) : null;
                if (!parsed) return;
                if (tag.marker === '[DIAGRAM]') diagramData = parsed;
                else if (tag.marker === '[QUESTIONS]') questionsData = parsed;
                else if (tag.marker === '[IMAGE]') imageData = parsed;
                else if (tag.marker === '[SOURCES]') sources = parsed;
              } catch {
                // Payload split across a chunk boundary (rare, small payloads) —
                // fall back to showing it as plain text rather than losing it.
                streamAccumulator += tag.marker + payload;
              }
            });
          }

          const nextState = [...incomingMessages, { role: "ai", id: aiMessageId, text: streamAccumulator, diagram: diagramData, image: imageData, sources: sources, questions: questionsData }];
          finalMessages = nextState;
          setMessages(nextState);
          // Local state only during streaming — writing to Supabase on every token
          // would be dozens of round-trips per reply. One write happens below,
          // once the full reply is in.
          setSavedChats(prev => prev.map(c => c.id === workingChatId ? { ...c, history: nextState } : c));
        }
      }

      // MENTOR MODE: the AI asked for a form this turn — pop it up for the student.
      if (questionsData?.questions?.length) {
        setQuestionsModal({ id: aiMessageId, intro: questionsData.intro, questions: questionsData.questions });
      }

      if (!isIncognito) {
        supabase
          .from('chat_sessions')
          .update({ history: sanitizeForStorage(finalMessages), updated_at: new Date().toISOString() })
          .eq('id', workingChatId)
          .then(() => {}, () => {});
      }
    } catch (err: any) {
      setMessages(prev => [...prev.slice(0, -1), { role: "ai", text: `⚠️ API Error: ${err.message}` }]);
    } finally { setIsGenerating(false); }
  };

  const regenerateResponse = () => {
    if (messages.length < 2) return;
    const lastUserMessage = messages[messages.length - 2];
    if (lastUserMessage.role === 'user') {
      // Everything strictly BEFORE the message being resent — handleSendMessage
      // re-adds that message itself, so including it here would duplicate it.
      const historyBeforeIt = messages.slice(0, -2);
      setMessages(historyBeforeIt);
      handleSendMessage(undefined, lastUserMessage.text, historyBeforeIt);
    }
  };

  // Edit an earlier user message: discards everything from that point onward
  // (like ChatGPT's edit) and resends the edited text as a fresh turn.
  const editUserMessage = (index: number, newText: string) => {
    if (index < 0 || index >= messages.length || messages[index].role !== 'user') return;
    const historyBeforeIt = messages.slice(0, index);
    setMessages(historyBeforeIt);
    handleSendMessage(undefined, newText, historyBeforeIt);
  };

  // Student submitted the AI's pop-up question form — mark it answered, echo the
  // answers back into the chat as their reply, and let the AI continue with them.
  const handleSubmitQuestions = (submitted: { id: string; question: string; answer: string }[]) => {
    const targetId = questionsModal?.id;
    setQuestionsModal(null);
    if (targetId) setAnsweredQuestions(prev => ({ ...prev, [targetId]: true }));
    const summary = submitted.map(a => `- ${a.question} → ${a.answer}`).join("\n");
    handleSendMessage(undefined, `Here are my answers:\n${summary}`);
  };

  // Reopen the form for a given AI message (e.g. if the student tapped "Later").
  const openQuestionsFor = (msg: any) => {
    if (!msg?.questions?.questions?.length) return;
    setQuestionsModal({ id: msg.id, intro: msg.questions.intro, questions: msg.questions.questions });
  };

  const shareResponse = (text: string) => {
    if (navigator.share) {
      navigator.share({ title: 'bubbly Response', text: text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Response copied to clipboard!'));
    }
  };

  const openSourceViewer = (sources: any[]) => {
    setModalData(sources);
    setActiveModal("sourceViewer");
  };

  const openAssetViewer = (asset: any) => {
    setModalData(asset);
    if (asset.type === "study_plan") {
      setActiveModal("studyPlanViewer");
    } else {
      setActiveModal("assetViewer");
    }
  };

  // Open a generated asset as a full page in the chat area (only once it's ready).
  const openAsset = (row: any) => {
    if (!row) return;
    // "Failed — tap to dismiss" (Notebooks.tsx) — tapping a failed item removes
    // it instead of silently doing nothing.
    if (row.status === "failed") { deleteAsset(row); return; }
    if (row.status !== "ready") return;
    setActiveAssetId(row.id);
    setActiveView("asset");
    if (window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  // Persist AssetPage changes (quiz progress, per-question chats, content edits).
  const persistAsset = async (assetId: string, patch: any) => {
    setNotebookAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, ...patch } : a)));
    await supabase.from("notebook_assets").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", assetId);
  };

  // Row-menu actions for Notebooks (Supabase-backed notebook_assets).
  const toggleAssetPin = (asset: any) => persistAsset(asset.id, { pinned: !asset.pinned });

  const renameAsset = (asset: any, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    persistAsset(asset.id, { title: trimmed });
  };

  const deleteAsset = async (asset: any) => {
    setNotebookAssets((prev) => prev.filter((a) => a.id !== asset.id));
    if (activeAssetId === asset.id) { setActiveView("chat"); setActiveAssetId(null); }
    await supabase.from("notebook_assets").delete().eq("id", asset.id).eq("user_id", user.id);
  };

  const shareAsset = (asset: any) => {
    const text = `${asset.title}\n${asset.type}${asset.status === "ready" ? "" : ` (${asset.status})`}`;
    if (navigator.share) {
      navigator.share({ title: asset.title, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"));
    }
  };

  // Map a modal's config to the shape lib/ai/generate.ts expects.
  const buildGenConfig = (kind: string, c: any, sources: string[]) => {
    if (kind === "quiz") return { questionCount: c.count, difficulty: c.difficulty, topic: c.topic, sources };
    if (kind === "flashcards") return { cardCount: c.count, difficulty: c.difficulty, topic: c.topic, sources };
    if (kind === "summary") return { topic: c.topic, length: c.length, sources };
    if (kind === "slides") return { format: c.format, language: c.language, length: c.length, description: c.description, sources };
    return { examType: c.examType, sources, config: c.config }; // exam / guide
  };

  // Non-blocking generation: create a placeholder row that shows in Notebooks
  // instantly, close the config modal, and generate in the background (server-side,
  // durable). Supabase realtime flips it spinner -> ready. The user keeps working.
  const handleGenerate = async (
    kind: "quiz" | "flashcards" | "slides" | "summary" | "exam",
    label: string,
    config: any
  ) => {
    setActiveModal(null);
    const rowType = kind === "exam" && config?.examType === "guide" ? "guide" : kind;
    const { data: row, error } = await supabase
      .from("notebook_assets")
      .insert({ user_id: user.id, type: rowType, title: label, status: "generating", config: {}, state: {} })
      .select()
      .single();
    if (error || !row) {
      alert("Couldn't start generation. Please try again.");
      return;
    }
    setNotebookAssets((prev) => [row, ...prev]);

    (async () => {
      // Combine documents the student picked from their existing Vault (sourceIds)
      // with any brand-new files attached right in the modal (files, uploaded now).
      // Never let a fresh-upload hiccup wipe out already-valid picked sources —
      // quiz/flashcards/summary/slides can still generate from whatever's left, or
      // the topic alone. (Exam still needs at least one source either way.)
      let sources: string[] = config.sourceIds?.length ? [...config.sourceIds] : [];
      if (config.files?.length) {
        try {
          const uploadedIds = await uploadFilesToVault(config.files);
          sources = [...sources, ...uploadedIds];
        } catch (e) {
          console.warn("New file upload failed — continuing with any already-selected Vault sources:", e);
        }
      }
      try {
        const genConfig = buildGenConfig(kind, config, sources);
        await supabase.from("notebook_assets").update({ config: genConfig }).eq("id", row.id);
        const res = await fetch("/api/notebook/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId: row.id, type: rowType, config: genConfig }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Generation failed");
        }
      } catch (e: any) {
        await supabase
          .from("notebook_assets")
          .update({ status: "failed", error: e.message || "Generation failed" })
          .eq("id", row.id);
      }
    })();
  };

  // ============================================
  // AUDIO FUNCTIONS
  // ============================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setRecordingDuration(0);
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        setInputText(prev => prev ? `${prev} ${data.text}` : data.text);
        if (inputRef.current) inputRef.current.focus();
      } else {
        alert('Transcription failed. Please try again.');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio.');
    } finally { setIsTranscribing(false); }
  };

  // ============================================
  // FILE UPLOAD
  // ============================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Wrap each File the same shape the paste path uses: a plain object carrying
    // name/type/size as OWN enumerable props plus the raw File under `.raw`.
    // This matters because the later `{...x, indexing:true}` spreads clone the
    // entry, and a bare File's name/type/size are NON-ENUMERABLE prototype
    // getters — so a spread would silently drop them and the source would lose
    // its filename. Own enumerable props survive the clone.
    const newFiles = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      raw: file,
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleFileClick = (file: any) => {
    setModalData(file);
    setActiveModal("filePreview");
  };

  // ============================================
  // VAULT
  // ============================================
  const openVaultPreview = async (doc: any) => {
    setModalData(doc);
    setActiveModal("filePreview");
  };

  // ============================================
  // RENDER
  // ============================================
  if (isLoadingAuth) return (
    <div className={`h-dvh w-full ${colors.bgApp} flex items-center justify-center`}>
      <Head><title>Loading - bubbly</title></Head>
      <Loader2 className={`animate-spin ${colors.textPrimary} w-12 h-12`} />
    </div>
  );
  
  const createBlankWorkspace = (type: 'code' | 'diagram') => {
    router.push(`/workspace/${type}/new`);
  };
  if (!isAuthenticated || showAuthScreen) return (
    <div className={`h-dvh w-full ${colors.bgApp} flex items-center justify-center transition-colors duration-300`}>
      <Head><title>Redirecting - bubbly</title></Head>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className={`animate-spin ${colors.textPrimary} w-8 h-8`} />
        <a href="/login" className={`text-sm ${colors.textSecondary} hover:underline`}>
          Sign in to continue →
        </a>
      </div>
    </div>
  );

  const activeAsset = notebookAssets.find((a) => a.id === activeAssetId) || null;

  return (
    <div className={`flex h-dvh w-full ${colors.bgApp} ${colors.textPrimary} overflow-hidden transition-colors duration-300`}>
      <Head>
        <title>bubbly</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}

     {/* Sidebar */}
<Sidebar
  isOpen={isSidebarOpen}
  isMobileMenuOpen={isMobileMenuOpen}
  onToggle={() => setSidebarOpen(!isSidebarOpen)}
  onCloseMobile={() => setIsMobileMenuOpen(false)}
  user={user}
  notebookAssets={notebookAssets}
  categorizedChats={categorizedChats}
  currentChatId={currentChatId}
  onStartNewChat={startNewChat}
  onLoadChat={loadChat}
  onOpenAsset={openAsset}
  onPinChat={toggleChatPin}
  onRenameChat={renameChat}
  onDeleteChat={deleteChat}
  onShareChat={shareChat}
  onExportChat={exportChat}
  onPinAsset={toggleAssetPin}
  onRenameAsset={renameAsset}
  onDeleteAsset={deleteAsset}
  onShareAsset={shareAsset}
  onOpenNewTask={() => setActiveModal("newTask")}
  onOpenSettings={() => { setActiveModal("settings"); setSettingsTab("general"); }}
  onOpenQuiz={() => setActiveModal("quiz")}
  onOpenFlashcards={() => setActiveModal("flashcards")}
  onOpenSummary={() => setActiveModal("summary")}
  onOpenSlides={() => setActiveModal("slides")}
  onOpenExam={() => setActiveModal("exam")}
  onNavigateToVault={() => {
    if (window.innerWidth < 768) setIsMobileMenuOpen(false);
    window.location.href = "/vault";
  }}
  onOpenClassrooms={() => router.push('/classrooms')}
  onCreateWorkspace={createBlankWorkspace}
  colors={colors}
  logoSrc={logoSrc}
  theme={theme}
  activeView={activeView}
/>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden w-full">
        {activeView === "asset" && activeAsset ? (
          <AssetPage
            asset={activeAsset}
            onBack={() => { setActiveView("chat"); setActiveAssetId(null); }}
            onPersist={(patch) => persistAsset(activeAsset.id, patch)}
          />
        ) : (
        <>
        {/* Header */}
        <div className={`flex items-center justify-between px-3 md:px-4 py-2 h-[48px] border-b ${colors.borderBase} ${colors.bgSidebar} md:bg-transparent md:border-b-0`}>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(true)} className={`md:hidden p-1.5 ${colors.textSecondary} ${colors.bgHover} rounded-lg`}>
              <Menu size={18} />
            </button>
          </div>
          <button onClick={() => setActiveModal("search")} className={`p-1.5 ${colors.bgInput} border ${colors.borderBase} rounded-full transition-all flex items-center justify-center shadow-sm`}>
            <Search size={15} className={colors.textSecondary} />
          </button>
        </div>

        {messages.length === 0 && <RecentActivityMobile />}

        {/* Chat View */}
        <ChatView
          messages={messages}
          isIncognito={isIncognito}
          onToggleIncognito={toggleIncognito}
          isGenerating={isGenerating}
          inputText={inputText}
          setInputText={setInputText}
          attachedFiles={attachedFiles}
          setAttachedFiles={setAttachedFiles}
          selectedModel={selectedModel}
          showModelPills={showModelPills}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          isTranscribing={isTranscribing}
          onSendMessage={handleSendMessage}
          onModelSelect={handleModelSelect}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onFileUpload={handleFileUpload}
          onGoogleDriveClick={launchGoogleDrivePicker}
          onFileClick={handleFileClick}
          onEditMessage={editUserMessage}
          onRegenerate={regenerateResponse}
          onShare={shareResponse}
          onOpenSourceViewer={openSourceViewer}
          onOpenAsset={openAssetViewer}
          answeredQuestions={answeredQuestions}
          onOpenQuestions={openQuestionsFor}
          activeQuestions={questionsModal}
          onSubmitQuestions={handleSubmitQuestions}
          onCloseQuestions={() => setQuestionsModal(null)}
          onOpenQuiz={() => setActiveModal("quiz")}
          onOpenFlashcards={() => setActiveModal("flashcards")}
          onOpenSummary={() => setActiveModal("summary")}
          onOpenSlides={() => setActiveModal("slides")}
          onOpenExam={() => setActiveModal("exam")}
          colors={colors}
          logoSrc={logoSrc}
          theme={theme}
          chatBottomRef={chatBottomRef}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
        />
        </>
        )}

        {/* Modals */}
        <SearchModal
          open={activeModal === "search"}
          onClose={() => setActiveModal(null)}
          chats={savedChats}
          onSelect={loadChat}
          colors={colors}
        />

        <SettingsModal
          open={activeModal === "settings"}
          onClose={() => setActiveModal(null)}
          initialTab={settingsTab}
          user={user}
          onSignOut={handleSignOut}
          onDeleteAccount={deleteAccount}
          onDeleteAllChats={handleDeleteAllChats}
          onExportData={exportAccountData}
          onSetImproveModel={setImproveModel}
          colors={colors}
        />

        <QuizModal
          open={activeModal === "quiz"}
          onClose={() => setActiveModal(null)}
          onGenerate={(config) => handleGenerate("quiz", "Quiz", config)}
          colors={colors}
          vaultDocuments={vaultDocuments}
        />

        <FlashcardModal
          open={activeModal === "flashcards"}
          onClose={() => setActiveModal(null)}
          onGenerate={(config) => handleGenerate("flashcards", "Flashcards", config)}
          colors={colors}
          vaultDocuments={vaultDocuments}
        />

        <SlidesModal
          open={activeModal === "slides"}
          onClose={() => setActiveModal(null)}
          onGenerate={(config) => handleGenerate("slides", "Slides", config)}
          colors={colors}
          vaultDocuments={vaultDocuments}
        />

        <SummaryModal
          open={activeModal === "summary"}
          onClose={() => setActiveModal(null)}
          onGenerate={(config) => handleGenerate("summary", "Summary", config)}
          colors={colors}
          vaultDocuments={vaultDocuments}
        />

        <ExamModal
          open={activeModal === "exam"}
          onClose={() => setActiveModal(null)}
          onGenerate={(config) => handleGenerate("exam", "Exam Prep", config)}
          colors={colors}
          vaultDocuments={vaultDocuments}
        />

        <SourcesModal
          open={activeModal === "sources"}
          onClose={() => setActiveModal(null)}
          sources={[]}
          onConfirm={(selected) => {
            setActiveModal(null);
          }}
          colors={colors}
        />

        <FilePreviewModal
          isOpen={activeModal === "filePreview"}
          onClose={() => setActiveModal(null)}
          file={modalData}
        />

        <AssetViewer
          open={activeModal === "assetViewer"}
          onClose={() => setActiveModal(null)}
          asset={modalData}
          colors={colors}
        />

        <SourceViewerModal
          open={activeModal === "sourceViewer"}
          onClose={() => setActiveModal(null)}
          sources={modalData}
          colors={colors}
        />

        <StudyPlanViewer
          open={activeModal === "studyPlanViewer"}
          onClose={() => setActiveModal(null)}
          asset={modalData}
        />

        {activeModal === "newTask" && (
          <NewTaskModal 
            onClose={() => setActiveModal(null)}
            onSuccess={(taskId) => {
              setActiveModal(null);
              window.location.href = `/tasks/${taskId}`;
            }}
          />
        )}

      </div>
    </div>
  );
}