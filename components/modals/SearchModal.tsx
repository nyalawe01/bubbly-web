"use client";
// components/modals/SearchModal.tsx
//
// Functional chat-history search: filters saved conversations by title and by
// message content, live as you type. Selecting a result loads that chat.
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, MessageSquare } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  chats: any[];
  onSelect: (chat: any) => void;
  colors: any;
}

function matchText(chat: any, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if ((chat.title || "").toLowerCase().includes(needle)) return true;
  const history = Array.isArray(chat.history) ? chat.history : [];
  return history.some((m: any) => (m.text || m.content || "").toLowerCase().includes(needle));
}

export function SearchModal({ open, onClose, chats, onSelect, colors }: SearchModalProps) {
  const [q, setQ] = useState("");
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(
    () => chats.filter((c) => !c.isNotebookAsset).filter((c) => matchText(c, q)),
    [chats, q]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg ${colors.bgCard} border ${colors.borderBase} rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}
      >
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${colors.borderBase}`}>
          <Search size={16} className={colors.textSecondary} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("chat.searchChats")}
            className={`flex-1 bg-transparent outline-none text-sm ${colors.textPrimary}`}
            style={{ fontFamily: "var(--font-body, inherit)" }}
          />
          <button onClick={onClose} className="nav-row p-1 rounded-md">
            <X size={16} className={colors.textSecondary} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto panel-scroll p-2">
          {results.length === 0 ? (
            <p className={`px-3 py-6 text-center text-sm ${colors.textSecondary}`}>
              {q ? t("chat.noMatches") : t("chat.searchHint")}
            </p>
          ) : (
            results.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelect(chat);
                  onClose();
                }}
                className={`nav-row w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${colors.bgHover}`}
              >
                <MessageSquare size={15} className={colors.textSecondary} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${colors.textPrimary}`}>{chat.title || "Untitled chat"}</p>
                  {chat.date && <p className={`text-[11px] ${colors.textSecondary}`}>{chat.date}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
