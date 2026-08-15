"use client";
import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, FileText, UploadCloud, Paperclip } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { UniversalPromptInput } from "@/components/ui/UniversalPromptInput";
import { VaultSourcePicker } from "./VaultSourcePicker";

interface SummaryModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (config: any) => void;
  colors: any;
  uploadedFiles?: File[];
  onFileUpload?: (files: File[]) => void;
  vaultDocuments?: any[];
}

export function SummaryModal({ open, onClose, onGenerate, colors, uploadedFiles = [], onFileUpload, vaultDocuments = [] }: SummaryModalProps) {
  const [topic, setTopic] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedVaultIds, setSelectedVaultIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleVaultSource = (id: string) =>
    setSelectedVaultIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const sourceCount = selectedVaultIds.length + files.length;

  useEffect(() => {
    if (uploadedFiles && uploadedFiles.length > 0) setFiles(uploadedFiles);
  }, [uploadedFiles]);

  if (!open) return null;

  const showHints = !isFocused && !topic;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles) {
      const fileArray = Array.from(newFiles);
      setFiles((prev) => [...prev, ...fileArray]);
      onFileUpload?.(fileArray);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[800px] overflow-hidden rounded-2xl border ${colors.borderBase} ${colors.bgCard} shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className={`flex items-center justify-between border-b ${colors.borderBase} px-6 py-4`}>
          <div className="flex items-center gap-3">
            {showSources ? (
              <button onClick={() => setShowSources(false)} className={`icon-motion ${colors.textSecondary} hover:${colors.textPrimary}`}>← Back</button>
            ) : (
              <FileText className={`h-5 w-5 ${colors.textSecondary}`} />
            )}
            <h2 className={`text-lg font-semibold ${colors.textPrimary}`}>{showSources ? "Sources" : "Generate Summary"}</h2>
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        {!showSources ? (
          <div className="p-6">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Sources</p>
                <button onClick={() => setShowSources(true)} className={`icon-motion flex items-center gap-2 rounded-full border ${colors.borderBase} ${colors.bgInput} px-4 py-1.5 text-sm font-medium ${colors.textPrimary} hover:${colors.bgHover}`}>
                  {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>What should the topic be?</p>
              <div className="relative">
                <UniversalPromptInput
                  value={topic}
                  onChange={setTopic}
                  onSubmit={() => {}}
                  placeholder={showHints ? "Things to try:\n• Summarize the key concepts of physics\n• Create a summary of Ancient Egypt history\n• Summarize the main points from the attached document" : ""}
                  size="md"
                />
              </div>
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
              <button onClick={() => fileInputRef.current?.click()} className={`icon-motion flex items-center gap-2 ${colors.btnPrimary} px-4 py-2 rounded-xl text-sm font-medium`}>
                <UploadCloud size={16} /> Upload Files
              </button>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
        )}

        <div className={`flex justify-end border-t ${colors.borderBase} px-6 py-4`}>
          <button onClick={() => onGenerate({ topic, files, sourceIds: selectedVaultIds })} className={`icon-motion rounded-full border ${colors.borderBase} ${colors.bgInput} px-6 py-2 text-sm font-medium ${colors.textPrimary} hover:${colors.bgHover}`}>
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}