"use client";
import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ArrowDown, EyeOff } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { ChatQuestionsForm } from "./ChatQuestionsForm";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { QuickActionPills } from "./QuickActionPills";
import { ArtLayer } from "@/components/ui/ArtLayer";
import { useI18n } from "@/components/i18n/I18nProvider";

// Canvas/WASM-based — rendered client-only to avoid an SSR/hydration mismatch.
const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
  { ssr: false }
);
const HERO_LOTTIE_SRC = "https://lottie.host/a7719fd3-75b2-40a4-92bf-1393879984f6/s6oIomjnI3.lottie";

interface ChatViewProps {
  messages: any[];
  isIncognito?: boolean;
  onToggleIncognito?: () => void;
  isGenerating: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  attachedFiles: any[];
  setAttachedFiles: (files: any[]) => void;
  selectedModel: "instant" | "expert" | "vision";
  showModelPills: boolean;
  isRecording: boolean;
  recordingDuration: number;
  isTranscribing: boolean;
  onSendMessage: (e?: React.FormEvent) => void;
  onModelSelect: (model: "instant" | "expert" | "vision") => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileClick: (file: any) => void;
  onEditMessage: (index: number, newText: string) => void;
  onRegenerate: () => void;
  onShare: (text: string) => void;
  onOpenSourceViewer: (sources: any[]) => void;
  onOpenAsset: (asset: any) => void;
  answeredQuestions: Record<string, boolean>;
  onOpenQuestions: (msg: any) => void;
  activeQuestions: { id: string; intro?: string; questions: any[] } | null;
  onSubmitQuestions: (answers: { id: string; question: string; answer: string }[]) => void;
  onCloseQuestions: () => void;
  onOpenQuiz: () => void;
  onOpenFlashcards: () => void;
  onOpenSummary: () => void;
  onOpenSlides: () => void;
  onOpenExam: () => void;
  colors: any;
  logoSrc: string;
  theme: string;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const ACTION_KEYS = ["quiz", "flashcards", "slides", "summary", "exam"] as const;

export function ChatView(props: ChatViewProps) {
  const {
    messages,
    isIncognito,
    onToggleIncognito,
    isGenerating,
    inputText,
    setInputText,
    attachedFiles,
    setAttachedFiles,
    selectedModel,
    showModelPills,
    isRecording,
    recordingDuration,
    isTranscribing,
    onSendMessage,
    onModelSelect,
    onStartRecording,
    onStopRecording,
    onFileUpload,
    onFileClick,
    onEditMessage,
    onRegenerate,
    onShare,
    onOpenSourceViewer,
    onOpenAsset,
    answeredQuestions,
    onOpenQuestions,
    activeQuestions,
    onSubmitQuestions,
    onCloseQuestions,
    onOpenQuiz,
    onOpenFlashcards,
    onOpenSummary,
    onOpenSlides,
    onOpenExam,
    colors,
    logoSrc,
    theme,
    chatBottomRef,
    inputRef,
    fileInputRef,
  } = props;

  const { t } = useI18n();
  const actionLabels: Record<(typeof ACTION_KEYS)[number], string> = {
    quiz: t("nav.quiz"),
    summary: t("nav.summary"),
    flashcards: t("nav.flashcards"),
    slides: t("nav.slides"),
    exam: t("nav.examPrep"),
  };

  // Floating "jump to latest" control: show it whenever the student has scrolled
  // meaningfully up from the newest message, so they can shoot back down fast.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowJump(distanceFromBottom > 240);
  };

  const scrollToLatest = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  // Re-evaluate on new messages / streaming growth (content can push the bottom away).
  useEffect(() => {
    handleScroll();
  }, [messages, isGenerating]);

  // On-screen keyboard detection (mobile browsers shrink the visual viewport,
  // not the layout viewport, when the keyboard opens). Only the composer
  // should stay pinned above the keyboard — everything else extra (the
  // generator pills) hides so it doesn't fight the composer for the
  // remaining space; it reappears once the keyboard closes.
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    let maxHeight = vv.height;
    const onResize = () => {
      maxHeight = Math.max(maxHeight, vv.height);
      setKeyboardOpen(maxHeight - vv.height > 120);
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {isIncognito && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 py-1 text-[11px] font-medium text-neutral-200 shadow-lg backdrop-blur">
          <EyeOff size={12} /> Incognito — this chat won&apos;t be saved
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-20 pt-4 md:pt-6 pb-48 md:pb-56 hide-scrollbar scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 md:space-y-3 mt-[-5vh] md:mt-[-10vh] animate-in fade-in relative">
            {/* Curated, theme-aware illustration vignette behind the hero. */}
            <ArtLayer surface="chat" hero />

            <div className="w-[140px] h-[140px] md:w-[170px] md:h-[170px] relative z-10 -mb-2">
              <DotLottieReact src={HERO_LOTTIE_SRC} loop autoplay style={{ width: "100%", height: "100%" }} />
            </div>

            <h1 className="text-2xl md:text-2xl font-medium tracking-tight relative z-10 px-4">
              {t("chat.explore")}
            </h1>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  <UserMessage
                    message={msg}
                    onFileClick={onFileClick}
                    onEdit={(newText) => onEditMessage(i, newText)}
                    colors={colors}
                  />
                ) : (
                  <AIMessage
                    message={msg}
                    isGenerating={isGenerating}
                    onRegenerate={onRegenerate}
                    onShare={onShare}
                    onOpenSourceViewer={onOpenSourceViewer}
                    onOpenAsset={onOpenAsset}
                    questionsAnswered={!!(msg.id && answeredQuestions[msg.id])}
                    onOpenQuestions={() => onOpenQuestions(msg)}
                    colors={colors}
                    theme={theme}
                  />
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-start gap-2 md:gap-4 animate-in fade-in">
                <div className="flex items-center gap-2 h-10">
                  <div className="think-orbit">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="text-[10px] md:text-xs text-zinc-400 ml-1">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* Jump-to-latest — floats centered just above the composer, only when scrolled up
          and not while the question form is occupying that space. */}
      {messages.length > 0 && showJump && !activeQuestions && (
        <button
          onClick={scrollToLatest}
          aria-label="Scroll to latest message"
          className={`absolute left-1/2 -translate-x-1/2 bottom-32 md:bottom-40 z-30 w-10 h-10 rounded-full flex items-center justify-center border ${colors.borderBase} ${colors.bgCard} ${colors.bgHover} shadow-lg animate-in fade-in zoom-in-95 duration-200`}
        >
          <ArrowDown size={18} className={colors.textPrimary} />
        </button>
      )}

      <div className="absolute bottom-0 w-full bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pb-6 pt-20 md:pt-24 px-6 md:px-24 safe-bottom">
        {/* Mentor questions rise from just above the textbox, one at a time. */}
        {activeQuestions && (
          <ChatQuestionsForm
            intro={activeQuestions.intro}
            questions={activeQuestions.questions}
            onSubmit={onSubmitQuestions}
            onClose={onCloseQuestions}
            colors={colors}
          />
        )}
        <ChatInput
          isIncognito={isIncognito}
          onToggleIncognito={onToggleIncognito}
          inputText={inputText}
          setInputText={setInputText}
          attachedFiles={attachedFiles}
          setAttachedFiles={setAttachedFiles}
          isGenerating={isGenerating}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          isTranscribing={isTranscribing}
          selectedModel={selectedModel}
          showModelPills={showModelPills}
          onSendMessage={onSendMessage}
          onModelSelect={onModelSelect}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onFileUpload={onFileUpload}
          onFileClick={onFileClick}
          onOpenQuiz={onOpenQuiz}
          onOpenFlashcards={onOpenFlashcards}
          onOpenSlides={onOpenSlides}
          onOpenSummary={onOpenSummary}
          onOpenExam={onOpenExam}
          colors={colors}
          theme={theme}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
        />

        {/* Generator shortcuts, empty-chat only — pills reveal one by one from
            below the composer once it's rendered. Hidden while the on-screen
            keyboard is up so the composer isn't fighting them for space. */}
        {messages.length === 0 && !activeQuestions && !keyboardOpen && (
          <div className="mt-3 mb-1 flex justify-center">
            <QuickActionPills
              onOpenQuiz={onOpenQuiz}
              onOpenFlashcards={onOpenFlashcards}
              onOpenSlides={onOpenSlides}
              onOpenSummary={onOpenSummary}
              onOpenExam={onOpenExam}
              colors={colors}
              labels={actionLabels}
            />
          </div>
        )}
      </div>
    </div>
  );
}