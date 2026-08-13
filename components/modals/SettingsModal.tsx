"use client";
import { useState } from "react";
import { X, Settings, User, Database, Info, Monitor, Check, LogOut, Trash2, Bot } from "lucide-react";
import { useTheme, THEME_LABELS } from "@/components/theme/ThemeProvider";
import { useI18n } from "@/components/i18n/I18nProvider";
import { AnimatedChevron } from "@/components/ui/icons";
import { THEME_TOKENS, THEME_NAMES, type ThemeName } from "@/shared/constants/themes";
import { SUPPORTED_LANGS, LANG_LABELS } from "@/shared/i18n/catalog";

type Tab = "general" | "profile" | "data" | "about" | "agents";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
  user: any;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  onDeleteAllChats: () => void;
  onExportData: () => void;
  onSetImproveModel: (value: boolean) => void;
  colors: any;
}

export function SettingsModal({ open, onClose, initialTab = "general", user, onSignOut, onDeleteAccount, onDeleteAllChats, onExportData, onSetImproveModel, colors }: SettingsModalProps) {
  const { preference, setPreference, fontPref, setFontPref } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [langOpen, setLangOpen] = useState(false);

  if (!open) return null;

  const navItems = [
    { id: "general" as Tab, label: t("settings.general"), icon: Settings },
    { id: "profile" as Tab, label: t("settings.profile"), icon: User },
    { id: "data" as Tab, label: t("settings.data"), icon: Database },
    { id: "agents" as Tab, label: "Agents", icon: Bot },
    { id: "about" as Tab, label: t("settings.about"), icon: Info },
  ];

  const themeOptions: { id: ThemeName | "system"; label: string; swatch: string | null }[] = [
    ...THEME_NAMES.map((id) => ({ id, label: THEME_LABELS[id], swatch: THEME_TOKENS[id].accent })),
    { id: "system" as const, label: t("common.system"), swatch: null },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      {/* Full-screen sheet on mobile (no fixed-width sidebar to overflow the
          viewport); the desktop two-pane layout only kicks in at sm+, where
          max-h keeps it floating with margin from top/bottom instead of a
          fixed pixel height that touched the viewport edges on shorter
          screens. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex h-full w-full max-w-full flex-col overflow-hidden border-0 sm:h-auto sm:max-h-[85vh] sm:max-w-[720px] sm:flex-row sm:rounded-2xl sm:border ${colors.borderBase} ${colors.bgCard} shadow-2xl`}
      >
        {/* Sidebar — horizontal scrollable tab strip on mobile, vertical nav on sm+ */}
        <aside className={`shrink-0 ${colors.bgSidebar} p-3 sm:w-44`}>
          <h2 className={`hidden px-2.5 pb-3 pt-1.5 text-[15px] font-semibold sm:block ${colors.textPrimary}`}>Settings</h2>
          <nav className="flex gap-1 overflow-x-auto sm:block sm:space-y-0.5 sm:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors sm:w-full ${isActive ? colors.bgActive : `${colors.textSecondary} ${colors.bgHover}`}`}>
                  <Icon className="h-3.5 w-3.5" /> {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <section className={`relative flex-1 overflow-y-auto p-5 md:p-6 ${colors.bgApp}`}>
          <button onClick={onClose} className={`absolute right-4 top-4 ${colors.textSecondary} hover:${colors.textPrimary}`}><X className="h-4 w-4" /></button>
          <div className="pr-6">
            {tab === "general" && (
              <div className="space-y-6">
                <div>
                  <p className={`mb-2 text-[12px] font-medium ${colors.textSecondary}`}>{t("settings.theme")}</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {themeOptions.map((option) => {
                      const active = preference === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setPreference(option.id)}
                          className={`icon-motion flex flex-col items-center gap-1.5 rounded-xl border py-3.5 text-[12px] font-medium transition-all ${active ? colors.bgActive : `${colors.bgInput} ${colors.bgHover}`}`}
                        >
                          {option.swatch ? (
                            <span
                              className="h-4 w-4 rounded-full border border-black/10"
                              style={{ backgroundColor: option.swatch }}
                            />
                          ) : (
                            <Monitor className="h-4 w-4" />
                          )}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className={`mb-2 text-[12px] font-medium ${colors.textSecondary}`}>{t("settings.interfaceFont")}</p>
                  <div className={`inline-flex rounded-full border ${colors.borderBase} ${colors.bgInput} p-0.5`}>
                    {(["sans", "serif"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFontPref(f)}
                        style={{ fontFamily: f === "serif" ? "var(--font-serif)" : "var(--font-sans)" }}
                        className={`rounded-full px-4 py-1 text-[12px] font-medium transition-colors ${
                          fontPref === f ? colors.btnPrimary : `${colors.textSecondary} ${colors.bgHover}`
                        }`}
                      >
                        {f === "sans" ? t("settings.fontSans") : t("settings.fontSerif")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className={`text-[12px] font-medium ${colors.textSecondary}`}>{t("settings.language")}</p>
                  <div className="relative">
                    <button onClick={() => setLangOpen(!langOpen)} className={`flex items-center gap-1.5 rounded-full border ${colors.borderBase} ${colors.bgInput} px-3 py-1.5 text-[12px] font-medium ${colors.textPrimary} hover:${colors.bgHover}`}>
                      {LANG_LABELS[lang]} <AnimatedChevron size={14} className="text-neutral-500" open={langOpen} />
                    </button>
                    {langOpen && (
                      <div className={`absolute right-0 z-10 mt-2 w-48 max-h-60 overflow-y-auto rounded-xl border ${colors.borderBase} ${colors.bgCard} py-1 shadow-xl`}>
                        {SUPPORTED_LANGS.map((code) => (
                          <button key={code} onClick={() => { setLang(code); setLangOpen(false); }} className={`nav-row flex w-full items-center justify-between px-3 py-1.5 text-[12px] ${colors.textPrimary} ${colors.bgHover}`}>
                            {LANG_LABELS[code]} {lang === code && <Check className="h-3.5 w-3.5 text-neutral-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "profile" && (
              <div>
                <div className={`border-b ${colors.borderBase} py-3 flex items-center justify-between`}>
                  <span className={`text-[12px] font-medium ${colors.textPrimary}`}>Name</span>
                  <span className={`text-[12px] ${colors.textSecondary}`}>{user?.name || "Not set"}</span>
                </div>
                <div className={`border-b ${colors.borderBase} py-3 flex items-center justify-between`}>
                  <span className={`text-[12px] font-medium ${colors.textPrimary}`}>Email address</span>
                  <span className={`text-[12px] ${colors.textSecondary}`}>{user?.email || "Not set"}</span>
                </div>
                <div className={`border-b ${colors.borderBase} py-3 flex items-center justify-between`}>
                  <span className={`text-[12px] font-medium ${colors.textPrimary}`}>Phone number</span>
                  <span className={`text-[12px] ${colors.textSecondary}`}>-</span>
                </div>
                <div className={`border-b ${colors.borderBase} py-3 flex items-center justify-between`}>
                  <span className={`text-[12px] font-medium ${colors.textPrimary}`}>Log out of all devices</span>
                  <button onClick={onSignOut} className="rounded-full border border-red-300 px-4 py-1 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">Log out</button>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-red-500">Delete account</span>
                  <button onClick={onDeleteAccount} className="rounded-full border border-red-300 px-4 py-1 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">Delete</button>
                </div>
              </div>
            )}

            {tab === "data" && (
              <div className="space-y-4">
                <div className={`border-b ${colors.borderBase} pb-3`}>
                  <p className={`text-[12px] font-medium ${colors.textPrimary}`}>Improve the model for everyone</p>
                  <p className={`mt-1 text-[12px] ${colors.textSecondary}`}>Allow your content to be used to train our models and improve our services.</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => onSetImproveModel(!user?.improveModel)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${user?.improveModel ? "bg-[var(--accent)]" : "bg-neutral-300 dark:bg-neutral-700"}`}
                    >
                      <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all dark:bg-neutral-900 ${user?.improveModel ? "left-5" : "left-1"}`}></span>
                    </button>
                    <span className={`text-[12px] ${colors.textSecondary}`}>{user?.improveModel ? "On" : "Off"}</span>
                  </div>
                </div>
                <div className={`border-b ${colors.borderBase} pb-3`}>
                  <p className={`text-[12px] font-medium ${colors.textPrimary}`}>Export data</p>
                  <p className={`mt-1 text-[12px] ${colors.textSecondary}`}>Export your data including account information and chat history.</p>
                  <button onClick={onExportData} className={`mt-2.5 rounded-full border ${colors.borderBase} ${colors.bgInput} px-4 py-1 text-[12px] font-medium ${colors.textPrimary} hover:${colors.bgHover}`}>Export data</button>
                </div>
                <div>
                  <p className={`text-[12px] font-medium ${colors.textPrimary}`}>Delete all chats</p>
                  <button onClick={onDeleteAllChats} className="mt-1.5 rounded-full border border-red-300 px-4 py-1 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">Delete all</button>
                </div>
              </div>
            )}

            {tab === "agents" && (
              <div className="space-y-4">
                <div className={`border-b ${colors.borderBase} pb-3 flex items-center justify-between`}>
                  <div>
                    <p className={`text-[12px] font-medium ${colors.textPrimary}`}>Inactivity Monitor</p>
                    <p className={`mt-1 text-[12px] ${colors.textSecondary}`}>Detects when you are falling behind and builds a catch-up plan.</p>
                  </div>
                  <button className={`relative h-5 w-9 rounded-full transition-colors bg-[var(--accent)]`}>
                    <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all left-5`}></span>
                  </button>
                </div>
                <div className={`border-b ${colors.borderBase} pb-3 flex items-center justify-between`}>
                  <div>
                    <p className={`text-[12px] font-medium ${colors.textPrimary}`}>Deadline Guardian</p>
                    <p className={`mt-1 text-[12px] ${colors.textSecondary}`}>Monitors your calendar and warns you 3 days before exams.</p>
                  </div>
                  <button className={`relative h-5 w-9 rounded-full transition-colors bg-[var(--accent)]`}>
                    <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all left-5`}></span>
                  </button>
                </div>
                <div className={`border-b ${colors.borderBase} pb-3 flex items-center justify-between`}>
                  <div>
                    <p className={`text-[12px] font-medium ${colors.textPrimary}`}>Knowledge Gap Hunter</p>
                    <p className={`mt-1 text-[12px] ${colors.textSecondary}`}>Auto-generates review flashcards when your quiz scores drop.</p>
                  </div>
                  <button className={`relative h-5 w-9 rounded-full transition-colors bg-[var(--accent)]`}>
                    <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all left-5`}></span>
                  </button>
                </div>
                <div className={`pt-2`}>
                  <a href="/agents" className={`w-full block text-center rounded-lg border ${colors.borderBase} ${colors.bgInput} px-4 py-2 text-[12px] font-medium ${colors.textPrimary} hover:${colors.bgHover}`}>
                    View Agent Activity Log
                  </a>
                </div>
              </div>
            )}

            {tab === "about" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bgInput} text-[15px] font-bold ${colors.textPrimary}`}>b</div>
                  <div><p className={`text-[14px] font-semibold ${colors.textPrimary}`}>bubbly</p><p className={`text-[12px] ${colors.textSecondary}`}>Version 1.0.0</p></div>
                </div>
                <div className={`border-b ${colors.borderBase} pb-3`}>
                  <p className={`text-[12px] ${colors.textSecondary}`}>AI-powered academic platform for smarter learning.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => window.open("/terms", "_blank")} className={`flex items-center justify-between rounded-xl border ${colors.borderBase} ${colors.bgInput} px-3 py-2 text-[12px] ${colors.textPrimary} hover:${colors.bgHover}`}>Terms of Use <span className={`rounded-full ${colors.bgInput} px-2.5 py-0.5 text-[10px] ${colors.textSecondary}`}>View</span></button>
                  <button onClick={() => window.open("/privacy", "_blank")} className={`flex items-center justify-between rounded-xl border ${colors.borderBase} ${colors.bgInput} px-3 py-2 text-[12px] ${colors.textPrimary} hover:${colors.bgHover}`}>Privacy Policy <span className={`rounded-full ${colors.bgInput} px-2.5 py-0.5 text-[10px] ${colors.textSecondary}`}>View</span></button>
                  <button onClick={() => window.open("/help", "_blank")} className={`flex items-center justify-between rounded-xl border ${colors.borderBase} ${colors.bgInput} px-3 py-2 text-[12px] ${colors.textPrimary} hover:${colors.bgHover}`}>Help Center <span className={`rounded-full ${colors.bgInput} px-2.5 py-0.5 text-[10px] ${colors.textSecondary}`}>View</span></button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
