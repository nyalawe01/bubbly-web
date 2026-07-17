"use client";
import { useState } from "react";
import { X, Settings, User, Database, Info, Monitor, Check, LogOut, Trash2 } from "lucide-react";
import { useTheme, THEME_LABELS } from "@/components/theme/ThemeProvider";
import { useI18n } from "@/components/i18n/I18nProvider";
import { AnimatedChevron } from "@/components/ui/icons";
import { THEME_TOKENS, THEME_NAMES, type ThemeName } from "@/shared/constants/themes";
import { SUPPORTED_LANGS, LANG_LABELS } from "@/shared/i18n/catalog";

type Tab = "general" | "profile" | "data" | "about";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
  user: any;
  onSignOut: () => void;
  colors: any;
}

export function SettingsModal({ open, onClose, initialTab = "general", user, onSignOut, colors }: SettingsModalProps) {
  const { preference, setPreference, fontPref, setFontPref } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [langOpen, setLangOpen] = useState(false);

  if (!open) return null;

  const navItems = [
    { id: "general" as Tab, label: t("settings.general"), icon: Settings },
    { id: "profile" as Tab, label: t("settings.profile"), icon: User },
    { id: "data" as Tab, label: t("settings.data"), icon: Database },
    { id: "about" as Tab, label: t("settings.about"), icon: Info },
  ];

  const themeOptions: { id: ThemeName | "system"; label: string; swatch: string | null }[] = [
    ...THEME_NAMES.map((id) => ({ id, label: THEME_LABELS[id], swatch: THEME_TOKENS[id].accent })),
    { id: "system" as const, label: t("common.system"), swatch: null },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`flex h-[600px] w-full max-w-[820px] overflow-hidden rounded-2xl border ${colors.borderBase} ${colors.bgCard} shadow-2xl`}>
        {/* Sidebar */}
        <aside className={`w-56 shrink-0 ${colors.bgSidebar} p-4`}>
          <h2 className={`px-3 pb-4 pt-2 text-lg font-semibold ${colors.textPrimary}`}>Settings</h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button key={item.id} onClick={() => setTab(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? colors.bgActive : `${colors.textSecondary} ${colors.bgHover}`}`}>
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <section className={`relative flex-1 overflow-y-auto p-8 ${colors.bgApp}`}>
          <button onClick={onClose} className={`absolute right-6 top-6 ${colors.textSecondary} hover:${colors.textPrimary}`}><X className="h-5 w-5" /></button>
          <div className="pr-8">
            {tab === "general" && (
              <div className="space-y-8">
                <div>
                  <p className={`mb-3 text-sm font-medium ${colors.textSecondary}`}>{t("settings.theme")}</p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {themeOptions.map((option) => {
                      const active = preference === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setPreference(option.id)}
                          className={`icon-motion flex flex-col items-center gap-2 rounded-xl border py-5 text-sm font-medium transition-all ${active ? colors.bgActive : `${colors.bgInput} ${colors.bgHover}`}`}
                        >
                          {option.swatch ? (
                            <span
                              className="h-5 w-5 rounded-full border border-black/10"
                              style={{ backgroundColor: option.swatch }}
                            />
                          ) : (
                            <Monitor className="h-5 w-5" />
                          )}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className={`mb-3 text-sm font-medium ${colors.textSecondary}`}>{t("settings.interfaceFont")}</p>
                  <div className={`inline-flex rounded-full border ${colors.borderBase} ${colors.bgInput} p-0.5`}>
                    {(["sans", "serif"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFontPref(f)}
                        style={{ fontFamily: f === "serif" ? "var(--font-serif)" : "var(--font-sans)" }}
                        className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                          fontPref === f ? colors.btnPrimary : `${colors.textSecondary} ${colors.bgHover}`
                        }`}
                      >
                        {f === "sans" ? t("settings.fontSans") : t("settings.fontSerif")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${colors.textSecondary}`}>{t("settings.language")}</p>
                  <div className="relative">
                    <button onClick={() => setLangOpen(!langOpen)} className={`flex items-center gap-2 rounded-full border ${colors.borderBase} ${colors.bgInput} px-4 py-2 text-sm font-medium ${colors.textPrimary} hover:${colors.bgHover}`}>
                      {LANG_LABELS[lang]} <AnimatedChevron size={16} className="text-neutral-500" open={langOpen} />
                    </button>
                    {langOpen && (
                      <div className={`absolute right-0 z-10 mt-2 w-56 max-h-72 overflow-y-auto rounded-xl border ${colors.borderBase} ${colors.bgCard} py-1 shadow-xl`}>
                        {SUPPORTED_LANGS.map((code) => (
                          <button key={code} onClick={() => { setLang(code); setLangOpen(false); }} className={`nav-row flex w-full items-center justify-between px-4 py-2 text-sm ${colors.textPrimary} ${colors.bgHover}`}>
                            {LANG_LABELS[code]} {lang === code && <Check className="h-4 w-4 text-neutral-500" />}
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
                <div className={`border-b ${colors.borderBase} py-4 flex items-center justify-between`}>
                  <span className={`text-sm font-medium ${colors.textPrimary}`}>Name</span>
                  <span className={`text-sm ${colors.textSecondary}`}>{user?.name || "Not set"}</span>
                </div>
                <div className={`border-b ${colors.borderBase} py-4 flex items-center justify-between`}>
                  <span className={`text-sm font-medium ${colors.textPrimary}`}>Email address</span>
                  <span className={`text-sm ${colors.textSecondary}`}>{user?.email || "Not set"}</span>
                </div>
                <div className={`border-b ${colors.borderBase} py-4 flex items-center justify-between`}>
                  <span className={`text-sm font-medium ${colors.textPrimary}`}>Phone number</span>
                  <span className={`text-sm ${colors.textSecondary}`}>-</span>
                </div>
                <div className={`border-b ${colors.borderBase} py-4 flex items-center justify-between`}>
                  <span className={`text-sm font-medium ${colors.textPrimary}`}>Log out of all devices</span>
                  <button onClick={onSignOut} className="rounded-full border border-red-300 px-5 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">Log out</button>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-red-500">Delete account</span>
                  <button className="rounded-full border border-red-300 px-5 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">Delete</button>
                </div>
              </div>
            )}

            {tab === "data" && (
              <div className="space-y-6">
                <div className={`border-b ${colors.borderBase} pb-4`}>
                  <p className={`text-sm font-medium ${colors.textPrimary}`}>Improve the model for everyone</p>
                  <p className={`mt-1 text-sm ${colors.textSecondary}`}>Allow your content to be used to train our models and improve our services.</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button className="relative h-6 w-11 rounded-full bg-neutral-300 dark:bg-neutral-700"><span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all dark:bg-neutral-900"></span></button>
                    <span className={`text-sm ${colors.textSecondary}`}>Off</span>
                  </div>
                </div>
                <div className={`border-b ${colors.borderBase} pb-4`}>
                  <p className={`text-sm font-medium ${colors.textPrimary}`}>Shared links</p>
                  <p className={`mt-1 text-sm ${colors.textSecondary}`}>Export your data including account information and chat history.</p>
                  <button className={`mt-3 rounded-full border ${colors.borderBase} ${colors.bgInput} px-5 py-1.5 text-sm font-medium ${colors.textPrimary} hover:${colors.bgHover}`}>Export data</button>
                </div>
                <div>
                  <p className={`text-sm font-medium ${colors.textPrimary}`}>Delete all chats</p>
                  <button className="mt-2 rounded-full border border-red-300 px-5 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">Delete all</button>
                </div>
              </div>
            )}

            {tab === "about" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors.bgInput} text-lg font-bold ${colors.textPrimary}`}>b</div>
                  <div><p className={`text-lg font-semibold ${colors.textPrimary}`}>bubbly</p><p className={`text-sm ${colors.textSecondary}`}>Version 1.0.0</p></div>
                </div>
                <div className={`border-b ${colors.borderBase} pb-4`}>
                  <p className={`text-sm ${colors.textSecondary}`}>AI-powered academic platform for smarter learning.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button className={`flex items-center justify-between rounded-xl border ${colors.borderBase} ${colors.bgInput} px-4 py-3 text-sm ${colors.textPrimary} hover:${colors.bgHover}`}>Terms of Use <span className={`rounded-full ${colors.bgInput} px-3 py-0.5 text-xs ${colors.textSecondary}`}>View</span></button>
                  <button className={`flex items-center justify-between rounded-xl border ${colors.borderBase} ${colors.bgInput} px-4 py-3 text-sm ${colors.textPrimary} hover:${colors.bgHover}`}>Privacy Policy <span className={`rounded-full ${colors.bgInput} px-3 py-0.5 text-xs ${colors.textSecondary}`}>View</span></button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}