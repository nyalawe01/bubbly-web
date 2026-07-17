"use client";
import { useState } from "react";
import { ChevronDown, Pin } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { RowMenu } from "@/components/ui/RowMenu";

interface RecentsProps {
  chats: Record<string, any[]>;
  currentChatId: string | null;
  onLoadChat: (chat: any) => void;
  onPin: (chatId: string) => void;
  onRename: (chatId: string, title: string) => void;
  onDelete: (chatId: string) => void;
  onShare: (chat: any) => void;
  colors: any;
}

export function Recents({ chats, currentChatId, onLoadChat, onPin, onRename, onDelete, onShare, colors }: RecentsProps) {
  const [open, setOpen] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const { t } = useI18n();
  const hasChats = Object.values(chats).some((arr) => arr.length > 0);

  const startRename = (chat: any) => {
    setRenamingId(chat.id);
    setDraftTitle(chat.title || "");
  };
  const commitRename = (chatId: string) => {
    onRename(chatId, draftTitle);
    setRenamingId(null);
  };

  return (
    <div>
      {/* Collapsible section header — click to reveal/close the whole history. */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`nav-row w-full flex items-center justify-between px-1 mb-1 group`}
      >
        <span className={`text-[13px] font-semibold ${colors.textSecondary} uppercase tracking-wider`}>
          {t("nav.recents")}
        </span>
        <ChevronDown
          size={16}
          className={`${colors.textSecondary} transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {open && (
        <>
          {!hasChats ? (
            <div className={`px-3 py-2 text-[13px] ${colors.textSecondary} leading-relaxed`}>
              No chat history yet.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(chats).map(([category, chatList]) => {
                if (chatList.length === 0) return null;
                return (
                  <div key={category}>
                    <div className={`text-[12px] font-medium ${colors.textSecondary} uppercase tracking-wider mb-1 px-1 opacity-70 flex items-center gap-1`}>
                      {category === "Pinned" && <Pin size={10} />}
                      {category}
                    </div>
                    <div className="space-y-0.5">
                      {chatList.map((chat) => {
                        const isRenaming = renamingId === chat.id;
                        return (
                          <div
                            key={chat.id}
                            className={`group relative flex items-center gap-1 rounded-lg transition-colors ${
                              currentChatId === chat.id ? colors.bgActive : colors.bgHover
                            }`}
                          >
                            {isRenaming ? (
                              <input
                                autoFocus
                                value={draftTitle}
                                onChange={(e) => setDraftTitle(e.target.value)}
                                onBlur={() => commitRename(chat.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitRename(chat.id);
                                  if (e.key === "Escape") setRenamingId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className={`flex-1 min-w-0 text-[15px] leading-snug px-3 py-2 rounded-lg bg-transparent outline-none ${colors.textPrimary}`}
                              />
                            ) : (
                              <button
                                onClick={() => onLoadChat(chat)}
                                className={`flex-1 min-w-0 text-left truncate text-[15px] leading-snug px-3 py-2 ${
                                  currentChatId === chat.id ? colors.textPrimary : colors.textSecondary
                                }`}
                              >
                                {chat.title}
                              </button>
                            )}
                            {!isRenaming && (
                              <div className="pr-1">
                                <RowMenu
                                  pinned={!!chat.pinned}
                                  onShare={() => onShare(chat)}
                                  onTogglePin={() => onPin(chat.id)}
                                  onRename={() => startRename(chat)}
                                  onDelete={() => onDelete(chat.id)}
                                  colors={colors}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
