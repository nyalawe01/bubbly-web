"use client";
import { useState, useEffect, useRef } from "react";
import {
  Plus, Mic, Square, Loader2, X,
  Zap, Gem, ImageIcon, FileText,
} from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { AnimatedSendIcon } from "@/components/ui/icons";
import { FilePreviewModal, type PreviewableFile } from "@/components/ui/FilePreviewModal";

type ModelType = "instant" | "expert" | "vision";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  attachedFiles: any[];
  setAttachedFiles: (files: any[]) => void;
  isGenerating: boolean;
  isRecording: boolean;
  recordingDuration: number;
  isTranscribing: boolean;
  selectedModel: ModelType;
  showModelPills: boolean;
  onSendMessage: (e?: React.FormEvent) => void;
  onModelSelect: (model: ModelType) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGoogleDriveClick?: () => void;
  onFileClick: (file: any) => void;
  colors: any;
  theme: string;
  inputRef: React.RefObject<HTMLInputElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function ChatInput({
  inputText,
  setInputText,
  attachedFiles,
  setAttachedFiles,
  isGenerating,
  isRecording,
  recordingDuration,
  isTranscribing,
  selectedModel,
  showModelPills,
  onSendMessage,
  onModelSelect,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  onGoogleDriveClick,
  colors,
  theme,
  inputRef,
  fileInputRef,
}: ChatInputProps) {
  const [isUploadGridOpen, setIsUploadGridOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const uploadContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (uploadContainerRef.current && !uploadContainerRef.current.contains(event.target as Node)) {
        setIsUploadGridOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = 120;
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Bug fix: previously fired regardless of isGenerating, allowing a second
      // message to be sent (and a second stream started) mid-response.
      if (!isGenerating) onSendMessage(e);
    }
  };

  const modelIcons: Record<ModelType, React.ReactNode> = {
    instant: <Zap size={14} className="md:w-[16px] md:h-[16px]" />,
    expert: <Gem size={14} className="md:w-[16px] md:h-[16px]" />,
    vision: <ImageIcon size={14} className="md:w-[16px] md:h-[16px]" />,
  };

  const modelNames: Record<ModelType, string> = {
    instant: "Instant",
    expert: "Expert",
    vision: "Vision",
  };

  const canSend = !isGenerating && (inputText.trim().length > 0 || attachedFiles.length > 0);

  return (
    <div className="max-w-4xl mx-auto relative flex flex-col items-center">
      {showModelPills && (
        <div className={`flex items-center ${colors.bgInput} border ${colors.borderBase} rounded-full p-0.5 md:p-1 w-max mb-2 md:mb-3 shadow-sm transition-all`}>
          {(["instant", "expert", "vision"] as const).map((model) => (
            <button
              key={model}
              onClick={() => onModelSelect(model)}
              className={`icon-motion flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[11px] md:text-[13px] font-medium transition-colors ${
                selectedModel === model
                  ? theme === "dark"
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-200 text-black shadow-sm"
                  : `${colors.textSecondary} ${colors.bgHover}`
              }`}
            >
              {modelIcons[model]} {modelNames[model]}
            </button>
          ))}
        </div>
      )}

      <div className={`w-full ${colors.bgCard} border ${colors.borderBase} rounded-[24px] md:rounded-[32px] p-1.5 md:p-2 focus-within:${colors.borderFocus} ${theme === "dark" ? "" : "shadow-lg"} transition-all flex flex-col relative overflow-visible`}>
        <div className="absolute inset-0 rounded-[24px] md:rounded-[32px] overflow-hidden pointer-events-none">
          <div className="glow-line-left absolute top-0 h-[1.5px] w-1/2 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70"></div>
          <div className="glow-line-right absolute bottom-0 h-[1.5px] w-1/2 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70"></div>
        </div>

        {/* Attached file thumbnails — clicking the thumbnail now opens a real
            preview modal instead of doing nothing; the X button still removes it. */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 md:gap-3 px-2 md:px-3 pt-2 pb-2">
            {attachedFiles.map((f, i) => {
              const isImage = f.type?.startsWith('image/');
              const fileExt = f.name?.split('.').pop()?.toUpperCase() || 'FILE';
              const previewUrl = isImage && f instanceof File ? URL.createObjectURL(f) : '';

              return (
                <div
                  key={f.id || i}
                  onClick={() => setPreviewFile({ name: f.name, type: f.type, size: f.size, raw: f instanceof File ? f : undefined })}
                  className="relative w-20 md:w-[90px] h-20 md:h-[90px] rounded-[18px] overflow-hidden group border border-zinc-200 dark:border-zinc-700 bg-[#2d2d30] flex-shrink-0 shadow-sm cursor-pointer transition-transform hover:scale-[1.03]"
                >
                  {isImage && previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={f.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full p-2.5 flex flex-col justify-between bg-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-400">{fileExt}</span>
                      <span className="text-[10px] font-bold text-white line-clamp-3 uppercase leading-tight">{f.name}</span>
                    </div>
                  )}

                  <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-[4px] uppercase backdrop-blur-sm">
                      {fileExt}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // don't trigger the preview click underneath
                      setAttachedFiles(attachedFiles.filter((x) => x.id !== f.id && x !== f));
                    }}
                    className="icon-motion absolute top-1.5 right-1.5 bg-black/60 hover:bg-black text-white rounded-full p-1 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex px-1 md:px-2 py-1 mt-1">
          {/* max-w caps the readable line length (~70 characters) so typed text
              wraps to the next line at a comfortable width instead of stretching
              edge-to-edge on wide screens. */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message bubbly ${modelNames[selectedModel]}...`}
            rows={1}
            className={`flex-1 max-w-[70ch] bg-transparent outline-none py-1.5 md:py-2 ${colors.textPrimary} placeholder:${colors.textSecondary} text-[13px] md:text-[15px] font-medium resize-none min-h-[36px] max-h-[120px] overflow-y-auto hide-scrollbar`}
            style={{ height: 'auto' }}
          />
        </div>

        <div className="flex items-center justify-between mt-1 px-1 pb-1">
          <div className="flex items-center gap-1">
            <div className="relative flex items-center" ref={uploadContainerRef}>
              <IconButton
                icon={Plus}
                label="Attach"
                onClick={() => setIsUploadGridOpen(!isUploadGridOpen)}
                className={isUploadGridOpen ? "rotate-45" : ""}
              />

              {isUploadGridOpen && (
                <div className={`absolute bottom-full left-0 mb-2 w-48 md:w-56 ${colors.bgCard} border ${colors.borderBase} rounded-2xl p-1.5 z-50 shadow-2xl animate-in slide-in-from-bottom-2`}>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => { onFileUpload(e); setIsUploadGridOpen(false); }} />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`icon-motion w-full flex items-center gap-3 p-2.5 md:p-3 ${colors.bgHover} rounded-xl text-xs md:text-sm font-medium transition-colors`}
                  >
                    <FileText size={16} className={colors.textSecondary} />
                    Upload File
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsUploadGridOpen(false); onGoogleDriveClick?.(); }}
                    className={`icon-motion w-full flex items-center gap-3 p-2.5 md:p-3 ${colors.bgHover} rounded-xl text-xs md:text-sm font-medium transition-colors`}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" className={colors.textSecondary} fill="currentColor">
                       <path d="M12 2.5l-8.5 15h17L12 2.5zm-5.5 14L12 5.5l5.5 11h-11z" />
                    </svg>
                    Google Drive
                  </button>
                </div>
              )}
            </div>

            <IconButton
              icon={isRecording ? Square : isTranscribing ? Loader2 : Mic}
              label={isRecording ? "Stop recording" : "Record"}
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={isTranscribing}
              variant={isRecording ? "danger" : "ghost"}
              className={`${isRecording ? "bg-red-500 !text-white recording-pulse" : ""} ${isTranscribing ? "animate-spin" : ""}`}
            />
            {isRecording && (
              <span className="text-[10px] text-red-500 font-medium ml-1">
                {String(Math.floor(recordingDuration / 60)).padStart(2, "0")}:
                {String(recordingDuration % 60).padStart(2, "0")}
              </span>
            )}
          </div>

          <IconButton
            icon={isGenerating ? Loader2 : AnimatedSendIcon}
            label="Send"
            variant="solid"
            disabled={!canSend}
            onClick={() => onSendMessage()}
            className={isGenerating ? "animate-spin" : ""}
          />
        </div>
      </div>

      <div className={`text-center mt-2 text-[9px] md:text-[10px] ${colors.textSecondary} font-medium tracking-wide`}>
        bubbly Core Integration
      </div>

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}