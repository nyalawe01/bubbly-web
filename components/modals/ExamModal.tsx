"use client";
import { useState, useRef, useEffect } from "react";
import { X, GraduationCap, UploadCloud, Paperclip } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { VaultSourcePicker } from "./VaultSourcePicker";

interface ExamModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (config: any) => void;
  colors: any;
  uploadedFiles?: File[];
  onFileUpload?: (files: File[]) => void;
  vaultDocuments?: any[];
}

// Unlike Quiz/Flashcards/Slides/Summary, /api/exam requires at least one Vault
// source — there is no topic-only fallback — so Generate stays disabled until
// a source is attached.
export function ExamModal({ open, onClose, onGenerate, colors, uploadedFiles = [], onFileUpload, vaultDocuments = [] }: ExamModalProps) {
  const [examType, setExamType] = useState<"guide" | "exam">("guide");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedVaultIds, setSelectedVaultIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleVaultSource = (id: string) =>
    setSelectedVaultIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  useEffect(() => {
    if (uploadedFiles && uploadedFiles.length > 0) setFiles(uploadedFiles);
  }, [uploadedFiles]);

  if (!open) return null;

  const typeOptions = [
    { value: "guide" as const, label: "Study Guide", description: "A structured, easy-to-study outline generated from your sources." },
    { value: "exam" as const, label: "Practice Exam", description: "A graded set of practice questions with explanations." },
  ];
  const difficultyOptions = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles) {
      const fileArray = Array.from(newFiles);
      setFiles((prev) => [...prev, ...fileArray]);
      onFileUpload?.(fileArray);
    }
    e.target.value = "";
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const canGenerate = files.length > 0 || selectedVaultIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[800px] overflow-hidden rounded-2xl border ${colors.borderBase} ${colors.bgCard} shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className={`flex items-center justify-between border-b ${colors.borderBase} px-6 py-4`}>
          <div className="flex items-center gap-3">
            <GraduationCap className={`h-5 w-5 ${colors.textSecondary}`} />
            <h2 className={`text-lg font-semibold ${colors.textPrimary}`}>Exam Prep</h2>
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        <div className="p-6">
          <p className={`mb-3 text-sm font-medium ${colors.textSecondary}`}>What do you want to generate?</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {typeOptions.map((option) => {
              const isActive = option.value === examType;
              return (
                <button
                  key={option.value}
                  onClick={() => setExamType(option.value)}
                  className={`icon-motion rounded-xl border p-4 text-left transition-all ${isActive ? colors.bgActive : `${colors.bgInput} ${colors.bgHover}`}`}
                >
                  <h3 className={`font-semibold ${colors.textPrimary}`}>{option.label}</h3>
                  <p className={`mt-1 text-sm leading-relaxed ${colors.textSecondary}`}>{option.description}</p>
                </button>
              );
            })}
          </div>

          {examType === "exam" && (
            <div className="mt-6 flex flex-wrap gap-8">
              <div>
                <p className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Number of Questions</p>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className={`w-24 rounded-lg border ${colors.borderBase} ${colors.bgInput} px-3 py-2 text-sm ${colors.textPrimary} outline-none focus:border-[var(--accent)]`}
                />
              </div>
              <div>
                <p className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Level of Difficulty</p>
                <div className={`flex rounded-full border ${colors.borderBase} ${colors.bgInput} p-0.5`}>
                  {difficultyOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDifficulty(option.value)}
                      className={`icon-motion rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${difficulty === option.value ? `${colors.btnPrimary} shadow-sm` : `${colors.textSecondary} ${colors.bgHover}`}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className={`mb-3 text-sm font-medium ${colors.textSecondary}`}>
              Sources <span className={colors.textSecondary}>(required)</span>
            </p>
            <VaultSourcePicker documents={vaultDocuments} selectedIds={selectedVaultIds} onToggle={toggleVaultSource} colors={colors} />
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`icon-motion flex items-center gap-2 ${colors.btnPrimary} px-4 py-2 rounded-xl text-sm font-medium`}
            >
              <UploadCloud size={16} /> Upload Files
            </button>
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className={`flex items-center gap-2 ${colors.bgInput} border ${colors.borderBase} rounded-lg px-3 py-2`}>
                    <Paperclip size={14} className={colors.textSecondary} />
                    <span className={`text-xs ${colors.textPrimary} truncate max-w-[150px]`}>{file.name}</span>
                    <button onClick={() => removeFile(index)} className={`icon-motion ${colors.textSecondary} hover:${colors.textPrimary}`}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`flex justify-end border-t ${colors.borderBase} px-6 py-4`}>
          <button
            disabled={!canGenerate}
            onClick={() => onGenerate({ examType, config: { count, difficulty, types: ["multiple_choice"] }, files, sourceIds: selectedVaultIds })}
            className={`icon-motion rounded-full border ${colors.borderBase} ${colors.bgInput} px-6 py-2 text-sm font-medium ${colors.textPrimary} hover:${colors.bgHover} disabled:opacity-40 disabled:pointer-events-none`}
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
