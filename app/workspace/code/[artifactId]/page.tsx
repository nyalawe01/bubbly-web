"use client";
import { useState, useRef, useEffect } from "react";
import { use } from "react";
import { ArrowLeft, Play, Save, Terminal, Code2, PanelRightOpen, PanelRightClose } from "lucide-react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { AIProgrammerPanel } from "@/components/workspace/AIProgrammerPanel";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function CodeWorkspace({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params);
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [code, setCode] = useState("def reverse_list(head):\n    # Write your code here\n    pass\n\nprint('Hello Code!')");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

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
    <div className={`flex flex-col h-screen font-sans ${colors.bgApp} ${colors.textPrimary}`}>
      <div className={`h-12 border-b flex items-center justify-between px-4 shrink-0 ${colors.bgSidebar} ${colors.borderBase}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`hover:opacity-70 ${colors.textSecondary}`}>
            <ArrowLeft size={18} />
          </button>
          <div className={`flex items-center gap-2 text-sm ${colors.textPrimary}`}>
            <Code2 size={16} className="text-violet-500" />
            <span className="font-medium">main.py</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className={`p-1.5 hover:opacity-70 ${colors.textSecondary}`} title="Save">
            <Save size={16} />
          </button>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${colors.btnPrimary}`}
          >
            <Play size={14} className={isRunning ? "animate-pulse" : ""} /> {isRunning ? "Running..." : "Run"}
          </button>
          <button onClick={() => setPanelOpen(!panelOpen)} className={`p-1.5 hover:opacity-70 ml-2 border-l pl-4 ${colors.textSecondary} ${colors.borderBase}`}>
            {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          <div className="flex-1 overflow-hidden relative group">
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
              {output}
            </div>
          </div>
        </div>

        {/* AI Programmer Panel */}
        {panelOpen && (
          <div className={`w-80 border-l flex flex-col ${colors.bgSidebar} ${colors.borderBase}`}>
            <AIProgrammerPanel code={code} output={output} onApplyFix={(fixedCode) => setCode(fixedCode)} />
          </div>
        )}
      </div>
    </div>
  );
}
