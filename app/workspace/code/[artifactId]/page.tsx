"use client";
import { useState, useRef, useEffect } from "react";
import { use } from "react";
import { ArrowLeft, Play, Save, Terminal, Code2, PanelRightOpen, PanelRightClose } from "lucide-react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { AIProgrammerPanel } from "@/components/workspace/AIProgrammerPanel";

export default function CodeWorkspace({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params);
  const router = useRouter();
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
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-300 font-sans">
      <div className="h-12 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0 bg-[#181818]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-200">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <Code2 size={16} className="text-blue-400" />
            <span className="font-medium text-gray-200">main.py</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1.5 text-gray-400 hover:text-gray-200" title="Save">
            <Save size={16} />
          </button>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            <Play size={14} className={isRunning ? "animate-pulse" : ""} /> {isRunning ? "Running..." : "Run"}
          </button>
          <button onClick={() => setPanelOpen(!panelOpen)} className="p-1.5 text-gray-400 hover:text-gray-200 ml-2 border-l border-neutral-700 pl-4">
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
              theme="vs-dark"
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
          
          {/* Terminal / Output */}
          <div className="h-1/3 border-t border-neutral-800 bg-[#181818] flex flex-col shrink-0">
            <div className="h-9 border-b border-neutral-800 flex items-center px-4 gap-2 text-xs uppercase tracking-wider font-semibold text-gray-500">
              <Terminal size={14} /> Output
            </div>
            <div className="flex-1 p-4 overflow-auto font-mono text-[13px] text-gray-400 whitespace-pre-wrap">
              {output || "Run code to see output..."}
            </div>
          </div>
        </div>

        {/* AI Programmer Panel */}
        {panelOpen && (
          <div className="w-80 border-l border-neutral-800 bg-[#181818] shrink-0 flex flex-col">
            <AIProgrammerPanel code={code} output={output} onApplyFix={(fixedCode) => setCode(fixedCode)} />
          </div>
        )}
      </div>
    </div>
  );
}
