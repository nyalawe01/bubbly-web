"use client";
import { useState, useRef, useEffect } from "react";
import { use } from "react";
import { ArrowLeft, Play, Save, Terminal, Code2, PanelRightOpen, PanelRightClose, Sparkles, Loader2, ArrowRight, Paperclip, Mic, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { AIProgrammerPanel } from "@/components/workspace/AIProgrammerPanel";
import { useTheme } from "@/components/theme/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = "welcome" | "generating" | "editor";

export default function CodeWorkspace({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params);
  const router = useRouter();
  const { colors, theme } = useTheme();
  
  const [viewState, setViewState] = useState<ViewState>("welcome");
  const [prompt, setPrompt] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  const handleGenerate = (text: string) => {
    if (!text.trim()) return;
    setViewState("generating");
    
    // Simulate AI generation delay
    setTimeout(() => {
      setCode(`def main():\n    print("Welcome to your new ${text} project!")\n\nif __name__ == "__main__":\n    main()`);
      setViewState("editor");
      // Open panel automatically to show AI message
      setPanelOpen(true);
    }, 2500);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("Executing in secure sandbox...\n");
    
    try {
      const res = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python", sandboxId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute");
      
      setSandboxId(data.sandboxId);
      
      const { stdout, stderr, execution_time_ms } = data.result;
      let out = "";
      if (stdout) out += stdout + "\n";
      if (stderr) out += stderr + "\n";
      out += `\n[Finished in ${execution_time_ms}ms]`;
      
      setOutput(out.trim());
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden ${colors.bgApp} ${colors.textPrimary}`}>
      
      {/* HEADER - Always visible but styled appropriately */}
      {/* HEADER - Only visible when in editor */}
      <AnimatePresence>
        {viewState === "editor" && (
          <motion.div 
            layout
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`h-12 border-b flex items-center justify-between px-4 shrink-0 z-20 relative ${colors.bgSidebar} ${colors.borderBase}`}
          >
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className={`hover:opacity-70 transition-opacity ${colors.textSecondary}`}>
                <ArrowLeft size={18} />
              </button>
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 text-sm ${colors.textPrimary}`}
              >
                <Code2 size={16} className="text-violet-500" />
                <span className="font-medium">main.py</span>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <button className={`p-1.5 hover:opacity-70 transition-opacity ${colors.textSecondary}`} title="Save">
                <Save size={16} />
              </button>
              <button 
                onClick={handleRun}
                disabled={isRunning}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${colors.btnPrimary}`}
              >
                <Play size={14} className={isRunning ? "animate-pulse" : ""} /> {isRunning ? "Running..." : "Run"}
              </button>
              <button onClick={() => setPanelOpen(!panelOpen)} className={`p-1.5 hover:opacity-70 transition-opacity ml-2 border-l pl-4 ${colors.textSecondary} ${colors.borderBase}`}>
                {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative flex overflow-hidden">
        
        <AnimatePresence mode="wait">
          {viewState !== "editor" ? (
            /* WELCOME / GENERATING CANVAS */
            <motion.div 
              key="welcome-canvas"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center z-10"
            >
              <div className="w-full max-w-2xl px-6 flex flex-col items-center gap-12">
                
                {/* Central Chat / Action Area */}
                <div 
                  className={`
                    relative flex items-end w-full rounded-2xl p-2 transition-all duration-300
                    ${colors.bgCard} shadow-2xl backdrop-blur-xl
                    before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:transition-all before:duration-500
                    ${isFocused ? 'before:bg-gradient-to-r before:from-violet-500 before:via-fuchsia-500 before:to-violet-500 before:p-[2px] before:animate-pulse before:shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'before:bg-neutral-500/20 before:p-[1px]'}
                  `}
                >
                  <div className={`w-full flex items-end gap-2 rounded-xl p-2 ${colors.bgCard}`}>
                    <button className={`p-3 shrink-0 rounded-xl transition-colors ${colors.textSecondary} hover:text-violet-500 hover:bg-violet-500/10`}>
                      <Paperclip size={20} />
                    </button>
                    
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerate(prompt);
                        }
                      }}
                      placeholder="What do you want to build?"
                      className={`w-full bg-transparent border-none resize-none max-h-48 min-h-[44px] py-3 px-2 text-sm focus:outline-none placeholder:text-neutral-500 ${colors.textPrimary}`}
                      rows={Math.min(5, prompt.split('\n').length || 1)}
                    />
                    
                    <div className="flex items-center gap-1 shrink-0 pb-1 pr-1">
                      <button className={`p-2.5 rounded-xl transition-colors ${colors.textSecondary} hover:text-violet-500 hover:bg-violet-500/10`}>
                        <Mic size={18} />
                      </button>
                      <button 
                        onClick={() => handleGenerate(prompt)}
                        disabled={!prompt.trim() || viewState === "generating"}
                        className={`p-2.5 rounded-xl transition-all ${prompt.trim() ? 'bg-violet-500 text-white shadow-md hover:bg-violet-600 hover:scale-105 active:scale-95' : `${colors.textSecondary} opacity-50`}`}
                      >
                        {viewState === "generating" ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Glass Grid Suggestions */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: "Generate an e-commerce website", desc: "Full-stack React & Node.js" },
                      { title: "Build a To-Do API", desc: "Python FastAPI backend." },
                      { title: "Data Analyzer Script", desc: "Pandas script for CSV processing." }
                    ].map((suggestion, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setPrompt(suggestion.title);
                          handleGenerate(suggestion.title);
                        }}
                        disabled={viewState === "generating"}
                        className={`text-left p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] ${colors.bgCard} bg-opacity-50 backdrop-blur-md ${colors.borderBase} hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 cursor-pointer`}
                      >
                        <h3 className={`font-semibold mb-2 text-sm ${colors.textPrimary}`}>{suggestion.title}</h3>
                        <p className={`text-xs opacity-70 ${colors.textSecondary}`}>{suggestion.desc}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>

              </div>
            </motion.div>
          ) : (
            /* EDITOR AND SIDEBARS CANVAS */
            <motion.div 
              key="editor-canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-1 w-full h-full"
            >
              {/* Editor Area */}
              <div className="flex-1 flex flex-col h-full min-w-0 relative">
                <div className="flex-1 overflow-hidden relative">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "var(--font-mono)",
                      lineHeight: 24,
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      formatOnPaste: true,
                    }}
                  />
                </div>
                
                {/* Bottom Terminal */}
                <div className={`h-48 border-t flex flex-col ${colors.bgInput} ${colors.borderBase}`}>
                  <div className={`px-4 py-1 border-b flex items-center gap-2 text-xs font-semibold ${colors.textSecondary} ${colors.borderBase}`}>
                    <Terminal size={14} /> TERMINAL
                  </div>
                  <div className="flex-1 p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap">
                    {output || "Run code to see output..."}
                  </div>
                </div>
              </div>

              {/* AI Programmer Panel */}
              <AnimatePresence>
                {panelOpen && (
                  <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className={`border-l flex flex-col overflow-hidden shrink-0 ${colors.bgSidebar} ${colors.borderBase}`}
                  >
                    <div className="w-80 h-full flex flex-col">
                      <AIProgrammerPanel code={code} output={output} onApplyFix={(fixedCode) => setCode(fixedCode)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
