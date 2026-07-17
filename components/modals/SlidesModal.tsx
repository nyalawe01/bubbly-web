"use client";
import { useState, useRef, useEffect } from "react";
import { X, Check, GalleryHorizontalEnd, UploadCloud, Paperclip } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { AnimatedChevron } from "@/components/ui/icons";
import { VaultSourcePicker } from "./VaultSourcePicker";

interface SlidesModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (config: any) => void;
  colors: any;
  uploadedFiles?: File[];
  onFileUpload?: (files: File[]) => void;
  vaultDocuments?: any[];
}

export function SlidesModal({ open, onClose, onGenerate, colors, uploadedFiles = [], onFileUpload, vaultDocuments = [] }: SlidesModalProps) {
  const [format, setFormat] = useState("detailed");
  const [language, setLanguage] = useState("English");
  const [length, setLength] = useState("default");
  const [description, setDescription] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedVaultIds, setSelectedVaultIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleVaultSource = (id: string) =>
    setSelectedVaultIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const sourceCount = selectedVaultIds.length + files.length;

  useEffect(() => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      setFiles(uploadedFiles);
    }
  }, [uploadedFiles]);

  if (!open) return null;

  const formats = [
    { value: "detailed", title: "Detailed Deck", description: "A comprehensive deck with full text and details, perfect for emailing or reading on its own." },
    { value: "presenter", title: "Presenter Slides", description: "Clean, visual slides with key talking points to support you while you speak." },
  ];

  const languages = ["English", "简体中文", "Español", "Français", "Deutsch", "日本語", "한국어"];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles) {
      const fileArray = Array.from(newFiles);
      setFiles(prev => [...prev, ...fileArray]);
      onFileUpload?.(fileArray);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-[800px] overflow-hidden rounded-2xl border ${colors.borderBase} ${colors.bgCard} shadow-2xl`}>
        <div className={`flex items-center justify-between border-b ${colors.borderBase} px-6 py-4`}>
          <div className="flex items-center gap-3">
            {showSources ? (
              <button onClick={() => setShowSources(false)} className={`icon-motion ${colors.textSecondary} hover:${colors.textPrimary}`}>← Back</button>
            ) : (
              <GalleryHorizontalEnd className={`h-5 w-5 ${colors.textSecondary}`} />
            )}
            <h2 className={`text-lg font-semibold ${colors.textPrimary}`}>{showSources ? "Sources" : "Customize Slide Deck"}</h2>
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        {!showSources ? (
          <div className="p-6">
            <div>
              <p className={`mb-3 text-sm font-medium ${colors.textSecondary}`}>Format</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {formats.map((item) => {
                  const isActive = item.value === format;
                  return (
                    <button key={item.value} onClick={() => setFormat(item.value)} className={`rounded-xl border p-4 text-left transition-all ${isActive ? `${colors.bgActive}` : `${colors.bgInput} ${colors.bgHover}`}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${colors.textPrimary}`}>{item.title}</h3>
                        {isActive && <Check className={`h-5 w-5 ${colors.textPrimary}`} />}
                      </div>
                      <p className={`mt-1 text-sm leading-relaxed ${colors.textSecondary}`}>{item.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-8">
              <div>
                <p className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Choose language</p>
                <div className="relative">
                  <button onClick={() => setLangOpen(!langOpen)} className={`icon-motion flex w-48 items-center justify-between rounded-lg border ${colors.borderBase} ${colors.bgInput} px-4 py-2 text-sm ${colors.textPrimary} hover:${colors.bgHover}`}>
                    {language} <AnimatedChevron size={16} className="text-neutral-500" open={langOpen} />
                  </button>
                  {langOpen && (
                    <div className={`absolute left-0 z-10 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border ${colors.borderBase} ${colors.bgCard} py-1 shadow-xl`}>
                      {languages.map((lang) => (
                        <button key={lang} onClick={() => { setLanguage(lang); setLangOpen(false); }} className={`flex w-full items-center justify-between px-4 py-2 text-sm ${colors.textPrimary} hover:${colors.bgHover}`}>
                          {lang} {language === lang && <Check className="h-4 w-4 text-neutral-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Length</p>
                <div className={`flex rounded-full border ${colors.borderBase} ${colors.bgInput} p-0.5`}>
                  {["short", "default"].map((option) => (
                    <button key={option} onClick={() => setLength(option)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${length === option ? `${colors.btnPrimary} shadow-sm` : `${colors.textSecondary} ${colors.bgHover}`}`}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Sources</p>
                <button onClick={() => setShowSources(true)} className={`icon-motion flex items-center gap-2 rounded-full border ${colors.borderBase} ${colors.bgInput} px-4 py-1.5 text-sm font-medium ${colors.textPrimary} hover:${colors.bgHover}`}>
                  {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
                  <AnimatedChevron size={16} className="text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Describe the slide deck you want to create</p>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder='Add a high-level outline, or guide the audience, style, and focus: "Create a deck for beginners using a bold and playful style with a focus on step-by-step instructions."' className={`w-full resize-none rounded-xl border ${colors.borderBase} ${colors.bgInput} p-4 text-sm ${colors.textPrimary} placeholder:${colors.textSecondary} focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-all`} />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-4">
              <p className={`text-sm font-medium ${colors.textSecondary} mb-3`}>Select from your Vault</p>
              <VaultSourcePicker documents={vaultDocuments} selectedIds={selectedVaultIds} onToggle={toggleVaultSource} colors={colors} />
            </div>

            <div className="mb-4">
              <p className={`text-sm font-medium ${colors.textSecondary} mb-3`}>Or upload a new file</p>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-2 ${colors.btnPrimary} px-4 py-2 rounded-xl text-sm font-medium`}>
                <UploadCloud size={16} /> Upload Files
              </button>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className={`flex items-center gap-2 ${colors.bgInput} border ${colors.borderBase} rounded-lg px-3 py-2`}>
                    <Paperclip size={14} className={colors.textSecondary} />
                    <span className={`text-xs ${colors.textPrimary} truncate max-w-[150px]`}>{file.name}</span>
                    <button onClick={() => removeFile(index)} className={`icon-motion ${colors.textSecondary} hover:${colors.textPrimary}`}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`flex justify-end border-t ${colors.borderBase} px-6 py-4`}>
          <button onClick={() => onGenerate({ format, language, length, description, files, sourceIds: selectedVaultIds })} className={`rounded-full border ${colors.borderBase} ${colors.bgInput} px-6 py-2 text-sm font-medium ${colors.textPrimary} hover:${colors.bgHover} transition-all`}>Generate</button>
        </div>
      </div>
    </div>
  );
}