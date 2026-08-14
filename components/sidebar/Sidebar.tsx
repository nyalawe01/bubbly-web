"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  LogOut,
  BrainCircuit,
  ImageIcon,
  FileText,
  MonitorPlay,
  GraduationCap,
  X,
  ChevronDown,
} from "lucide-react";
import { Notebooks } from "./Notebooks";
import { Recents } from "./Recents";
import { NotificationsPopover } from "./NotificationsPopover";
import { createClient } from "@/app/utils/supabase";
import { useI18n } from "@/components/i18n/I18nProvider";
import { motion } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  isMobileMenuOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
  user: any;
  notebookAssets: any[];
  categorizedChats: Record<string, any[]>;
  currentChatId: string | null;
  onStartNewChat: () => void;
  onLoadChat: (chat: any) => void;
  onOpenAsset: (asset: any) => void;
  onPinChat: (chatId: string) => void;
  onRenameChat: (chatId: string, title: string) => void;
  onDeleteChat: (chatId: string) => void;
  onShareChat: (chat: any) => void;
  onExportChat: (chat: any) => void;
  onPinAsset: (asset: any) => void;
  onRenameAsset: (asset: any, title: string) => void;
  onDeleteAsset: (asset: any) => void;
  onShareAsset: (asset: any) => void;
  onOpenSettings: () => void;
  onOpenQuiz: () => void;
  onOpenFlashcards: () => void;
  onOpenSummary: () => void;
  onOpenSlides: () => void;
  onOpenExam: () => void;
  onNavigateToVault: () => void;
  onOpenNewTask: () => void;
  onSignOut?: () => void; // optional — falls back to a real Supabase sign-out if the page doesn't wire one
  colors: any;
  logoSrc: string;
  theme: string;
  activeView: string;
}

export function Sidebar({
  isOpen,
  isMobileMenuOpen,
  onToggle,
  onCloseMobile,
  user,
  notebookAssets,
  categorizedChats,
  currentChatId,
  onStartNewChat,
  onLoadChat,
  onOpenAsset,
  onPinChat,
  onRenameChat,
  onDeleteChat,
  onShareChat,
  onExportChat,
  onPinAsset,
  onRenameAsset,
  onDeleteAsset,
  onShareAsset,
  onOpenSettings,
  onOpenQuiz,
  onOpenFlashcards,
  onOpenSummary,
  onOpenSlides,
  onOpenExam,
  onNavigateToVault,
  onOpenNewTask,
  onSignOut,
  colors,
  logoSrc,
  theme,
  activeView,
}: SidebarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const showContent = isOpen || isMobileMenuOpen;
  const sidebarWidth = isMobileMenuOpen ? "w-[80vw] max-w-[280px]" : isOpen ? "w-60" : "w-[56px]";
  // Nav links, chat names, and notebook names go pure white in Dark theme only —
  // Light theme keeps its normal theme-driven text color (white-on-white there
  // would be unreadable). Inline style/icon color wins unambiguously over the
  // bgActive/bgHover classes' own baked-in text colors.
  const darkWhite = theme === "dark";

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    if (onSignOut) {
      onSignOut();
      return;
    }
    // Bug fix: this was a bare comment ("// Handle sign out") with no actual
    // implementation — clicking Sign Out did nothing. Real Supabase sign-out
    // + redirect to the auth screen now happens if the page doesn't supply
    // its own handler.
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // New Chat is a fixed action pinned at the top — deliberately NOT part of the
  // scrolling nav and never rendered "active" (it starts a new chat, it isn't a view).
  const toolItems = [
    { key: "quiz", label: t("nav.quiz"), icon: BrainCircuit, onClick: onOpenQuiz },
    { key: "flashcards", label: t("nav.flashcards"), icon: ImageIcon, onClick: onOpenFlashcards },
    { key: "summary", label: t("nav.summary"), icon: FileText, onClick: onOpenSummary },
    { key: "slides", label: t("nav.slides"), icon: MonitorPlay, onClick: onOpenSlides },
    { key: "exam", label: t("nav.examPrep"), icon: GraduationCap, onClick: onOpenExam },
    { key: "vault", label: t("nav.vault"), icon: FolderOpen, onClick: onNavigateToVault },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isMobileMenuOpen ? 280 : isOpen ? 240 : 56 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`
      fixed md:relative z-40 h-full flex flex-col border-r ${colors.borderBase} glass-panel
      ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      overflow-hidden
    `}
    >
      {/* Header — wordmark only (no logo image), no bottom border line. */}
      <div className="flex items-center justify-between px-3 h-[48px]">
        <div className={`flex items-center overflow-hidden ${!showContent ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
          <span
            className={`text-[18px] font-medium tracking-tight truncate ${colors.textPrimary}`}
            style={{ opacity: 0.92, fontFamily: "var(--font-display, inherit)" }}
          >
            bubbly
          </span>
        </div>
        <button
          onClick={onToggle}
          className={`icon-motion hidden md:block p-1.5 rounded-md ${colors.bgHover} ${colors.textSecondary} ${isOpen ? "ml-auto" : "mx-auto"}`}
        >
          {isOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>
        <button onClick={onCloseMobile} className={`icon-motion md:hidden p-1.5 rounded-md ${colors.textSecondary}`}>
          <X size={16} />
        </button>
      </div>

      {/* Fixed New Chat action — pinned, never scrolls, never shown "active". */}
      <div className="px-2 pb-1.5 space-y-1">
        <button
          onClick={onStartNewChat}
          className={`icon-motion w-full flex items-center gap-2.5 rounded-lg transition-colors ${colors.textPrimary} ${colors.bgHover} border ${colors.borderBase} ${
            showContent ? "px-2.5 py-2" : "justify-center py-2"
          }`}
        >
          <Plus size={16} className="flex-shrink-0" />
          {showContent && <span className="text-[13px] font-medium truncate">{t("nav.newChat")}</span>}
        </button>
        <button
          onClick={onOpenNewTask}
          className={`icon-motion w-full flex items-center gap-2.5 rounded-lg transition-colors ${colors.textPrimary} ${colors.bgHover} border ${colors.borderBase} ${
            showContent ? "px-2.5 py-2" : "justify-center py-2"
          }`}
        >
          <BrainCircuit size={16} className="flex-shrink-0" />
          {showContent && <span className="text-[13px] font-medium truncate">New Task</span>}
        </button>
      </div>

      {/* Single unified scroll region: tools + Notebooks + Recents scroll together. */}
      <div className="px-2 flex-1 overflow-y-auto hide-scrollbar space-y-3 pb-2">
        <div className="space-y-0.5">
          {toolItems.map(({ key, label, icon: Icon, onClick }) => {
            const isActive = activeView === key;
            return (
              <button
                key={key}
                onClick={onClick}
                className={`nav-row w-full flex items-center gap-2.5 rounded-lg transition-colors ${
                  showContent ? "px-2.5 py-2.5 md:py-1.5" : "justify-center py-2"
                } ${isActive ? colors.bgActive : `${colors.textSecondary} ${colors.bgHover}`}`}
              >
                <Icon size={17} className="flex-shrink-0 md:w-4 md:h-4" color={darkWhite ? "#ffffff" : undefined} />
                {showContent && (
                  <span className="text-[14px] md:text-[13px] font-medium truncate" style={darkWhite ? { color: "#fff" } : undefined}>
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showContent && (
          <>
            <div>
              <div className={`text-[11px] font-semibold ${colors.textSecondary} uppercase tracking-wider mb-1.5 px-1`}>
                {t("nav.notebooks")}
              </div>
              <Notebooks
                assets={notebookAssets}
                onOpenAsset={onOpenAsset}
                onPin={onPinAsset}
                onRename={onRenameAsset}
                onDelete={onDeleteAsset}
                onShare={onShareAsset}
                colors={colors}
                theme={theme}
              />
            </div>

            <Recents
              chats={categorizedChats}
              currentChatId={currentChatId}
              onLoadChat={onLoadChat}
              onPin={onPinChat}
              onRename={onRenameChat}
              onDelete={onDeleteChat}
              onShare={onShareChat}
              onExport={onExportChat}
              colors={colors}
              theme={theme}
            />
          </>
        )}
      </div>

      <div className={`p-2 relative border-t ${colors.borderBase}`}>
        {isProfileMenuOpen && (
          <div className={`absolute bottom-[60px] left-2 w-[200px] ${colors.bgCard} border ${colors.borderBase} rounded-xl p-1 z-50 shadow-2xl animate-in slide-in-from-bottom-2 duration-150`}>
            <button
              onClick={() => { setIsProfileMenuOpen(false); onOpenSettings(); }}
              className={`icon-motion w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] ${colors.bgHover} rounded-lg ${colors.textPrimary} font-medium`}
            >
              <Settings2 size={13} /> Settings
            </button>
            <div className={`h-px w-full ${colors.bgInput} my-1`} />
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="icon-motion w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-red-500 hover:bg-red-500/10 rounded-lg font-medium disabled:opacity-50"
            >
              <LogOut size={13} /> {signingOut ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        )}

        <div className="mb-2">
          <NotificationsPopover colors={colors} showContent={showContent} />
        </div>

        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={`icon-motion w-full flex items-center gap-2 p-1.5 rounded-xl ${colors.bgHover} transition-colors`}
        >
          <div className={`w-6 h-6 rounded-full ${colors.btnPrimary} flex items-center justify-center font-bold text-[10px] border ${colors.borderBase} flex-shrink-0 overflow-hidden`}>
            {user?.avatar_url ? (
               
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
          {showContent && (
            <div className="text-left flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{user?.name || "User"}</div>
              <div className={`text-[11px] ${colors.textSecondary} truncate`}>{user?.email || ""}</div>
            </div>
          )}
          {showContent && <ChevronDown size={14} className={`${colors.textSecondary} flex-shrink-0`} />}
        </button>
      </div>
    </motion.div>
  );
}