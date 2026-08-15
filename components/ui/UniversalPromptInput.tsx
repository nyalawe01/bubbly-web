"use client";
import { useRef } from "react";
import { Loader2, Mic, Paperclip, Send } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { AnimatedSendIcon } from "@/components/ui/icons";
import { IconButton } from "@/components/ui/IconButton";

interface UniversalPromptInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isGenerating?: boolean;
  showAttach?: boolean;
  showMic?: boolean;
  size?: 'md' | 'lg';
  disabled?: boolean;
}

export function UniversalPromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Message...",
  isGenerating = false,
  showAttach = false,
  showMic = false,
  size = 'md',
  disabled = false,
}: UniversalPromptInputProps) {
  const { colors, theme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isGenerating && !disabled) {
        onSubmit();
      }
    }
  };

  const isLg = size === 'lg';
  
  return (
    <div className={`
      relative flex flex-col w-full rounded-[24px] border ${colors.borderBase} shadow-sm transition-all duration-300
      ${colors.bgInput} focus-within:shadow-[0_0_15px_rgba(139,92,246,0.15)] focus-within:border-violet-500/50
    `}>
      <div className="flex px-3 py-2 mt-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, isLg ? 200 : 120) + 'px';
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isGenerating}
          rows={1}
          className={`
            flex-1 w-full bg-transparent !outline-none py-1.5 ${colors.textPrimary} placeholder:${colors.textSecondary} 
            ${isLg ? 'text-[16px] md:text-[15px] min-h-[48px]' : 'text-[15px] md:text-[13px] min-h-[32px]'}
            font-medium resize-none overflow-y-auto hide-scrollbar
          `}
          style={{ height: 'auto' }}
        />
      </div>

      <div className="flex items-center justify-between mt-1 px-2 pb-2">
        <div className="flex items-center gap-1">
          {showAttach && (
            <IconButton
              icon={Paperclip}
              label="Attach"
              onClick={() => {}}
            />
          )}
          {showMic && (
            <IconButton
              icon={Mic}
              label="Voice"
              onClick={() => {}}
            />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            </div>
          ) : (
            <button
              onClick={() => value.trim() && !disabled && onSubmit()}
              disabled={!value.trim() || disabled}
              className={`
                icon-motion flex items-center justify-center p-2 rounded-full transition-all
                ${value.trim() && !disabled ? 'bg-black text-white dark:bg-white dark:text-black shadow-md hover:scale-105 active:scale-95' : 'bg-transparent text-neutral-400 opacity-50 cursor-not-allowed'}
              `}
            >
              <AnimatedSendIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
