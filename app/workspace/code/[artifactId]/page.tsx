"use client";
import { useState, useRef, useEffect } from "react";
import { use } from "react";
import { ArrowLeft, Play, Save, Terminal, Code2, PanelRightOpen, PanelRightClose, Sparkles, Loader2, ArrowRight } from "lucide-react";
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
      <motion.div 
        layout
        className={`h-12 border-b flex items-center justify-between px-4 shrink-0 z-20 relative ${colors.bgSidebar} ${colors.borderBase}`}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`hover:opacity-70 transition-opacity ${colors.textSecondary}`}>
            <ArrowLeft size={18} />
          </button>
          <AnimatePresence>
            {viewState === "editor" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 text-sm ${colors.textPrimary}`}
              >
                <Code2 size={16} className="text-violet-500" />
                <span className="font-medium">main.py</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {viewState === "editor" && (
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
          )}
        </AnimatePresence>
      </motion.div>

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
              <div className="w-full max-w-2xl px-6 flex flex-col items-center">
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8 flex flex-col items-center"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl ${colors.bgCard} ${colors.borderBase} border`}>
                    <Code2 size={32} className="text-violet-500" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-center">What do you want to build?</h1>
                  <p className={`text-center text-lg ${colors.textSecondary}`}>
                    Describe your app, or start from a template.
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-full relative group"
                >
                  <div className={`absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200`}></div>
                  <div className={`relative flex items-center w-full rounded-xl border shadow-xl overflow-hidden ${colors.bgInput} ${colors.borderBase}`}>
                    <div className="pl-4 pr-2">
                      {viewState === "generating" ? (
                        <Loader2 className="animate-spin text-violet-500" size={24} />
                      ) : (
                        <Sparkles className="text-violet-500" size={24} />
                      )}
                    </div>
                    <input 
                      type="text"
                      disabled={viewState === "generating"}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleGenerate(prompt);
                      }}
                      placeholder="Build a Tanzanian agriculture app..."
                      className={`w-full py-4 px-2 bg-transparent outline-none text-lg ${colors.textPrimary} placeholder-opacity-50`}
                    />
                    <button 
                      onClick={() => handleGenerate(prompt)}
                      disabled={viewState === "generating" || !prompt.trim()}
                      className={`mr-2 p-2 rounded-lg transition-colors ${prompt.trim() ? colors.btnPrimary : "opacity-50 cursor-not-allowed"}`}
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full mt-12"
                >
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-4 px-2 ${colors.textSecondary}`}>Smart Suggestions</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: "React Portfolio", desc: "A modern personal site." },
                      { title: "To-Do API", desc: "Python FastAPI backend." },
                      { title: "Data Analyzer", desc: "Pandas script for CSVs." }
                    ].map((suggestion, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setPrompt(suggestion.title);
                          handleGenerate(suggestion.title);
                        }}
                        disabled={viewState === "generating"}
                        className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${colors.bgCard} ${colors.borderBase} hover:border-violet-500/50 cursor-pointer`}
                      >
                        <h3 className={`font-semibold mb-1 ${colors.textPrimary}`}>{suggestion.title}</h3>
                        <p className={`text-xs ${colors.textSecondary}`}>{suggestion.desc}</p>
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
