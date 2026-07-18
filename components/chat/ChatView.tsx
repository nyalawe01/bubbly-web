"use client";
import { useRef, useState, useEffect } from "react";
import { BrainCircuit, FileText, MonitorPlay, Layers, GraduationCap, ArrowDown } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { ChatQuestionsForm } from "./ChatQuestionsForm";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { Reveal } from "@/components/ui/motion";
import { ArtLayer } from "@/components/ui/ArtLayer";
import { IconChip } from "@/components/ui/IconChip";
import { useI18n } from "@/components/i18n/I18nProvider";

interface ChatViewProps {
  messages: any[];
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
  onGoogleDriveClick?: () => void;
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
  chatBottomRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const QUICK_ACTIONS = [
  { key: "quiz", label: "Generate Quiz", icon: BrainCircuit },
  { key: "summary", label: "Generate Summary", icon: FileText },
  { key: "flashcards", label: "Flashcards", icon: Layers },
  { key: "slides", label: "Slide Deck", icon: MonitorPlay },
  { key: "exam", label: "Exam Prep", icon: GraduationCap },
] as const;

export function ChatView(props: ChatViewProps) {
  const {
    messages,
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
    onGoogleDriveClick,
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
  const actionHandlers: Record<(typeof QUICK_ACTIONS)[number]["key"], () => void> = {
    quiz: onOpenQuiz,
    summary: onOpenSummary,
    flashcards: onOpenFlashcards,
    slides: onOpenSlides,
    exam: onOpenExam,
  };
  const actionLabels: Record<(typeof QUICK_ACTIONS)[number]["key"], string> = {
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

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-20 pt-4 md:pt-6 pb-48 md:pb-56 hide-scrollbar scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-5 md:space-y-6 mt-[-5vh] md:mt-[-10vh] animate-in fade-in relative">
            {/* Curated, theme-aware illustration vignette behind the hero. */}
            <ArtLayer surface="chat" hero />

            <h1 className="text-2xl md:text-2xl font-medium tracking-tight relative z-10 px-4">
              {t("chat.explore")}
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 md:gap-2.5 w-full max-w-2xl mt-3 relative z-10 px-2">
              {QUICK_ACTIONS.map(({ key, icon: Icon }, i) => (
                <Reveal key={key} delay={i * 0.05}>
                  <button
                    onClick={actionHandlers[key]}
                    className={`icon-motion w-full p-3 md:p-3 ${colors.bgCard} border ${colors.borderBase} rounded-xl ${colors.bgHover} flex flex-col items-center gap-1.5 shadow-sm`}
                  >
                    <IconChip icon={Icon} size={18} boxScale={2.2} className={`border ${colors.borderBase} shadow-sm`} />
                    <span className="text-[11px] md:text-xs font-medium text-center leading-tight">{actionLabels[key]}</span>
                  </button>
                </Reveal>
              ))}
            </div>
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

      <div className="absolute bottom-0 w-full bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pb-3 md:pb-6 pt-20 md:pt-24 px-6 md:px-24 safe-bottom">
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
          onGoogleDriveClick={onGoogleDriveClick}
          onFileClick={onFileClick}
          colors={colors}
          theme={theme}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
        />
      </div>
    </div>
  );
}