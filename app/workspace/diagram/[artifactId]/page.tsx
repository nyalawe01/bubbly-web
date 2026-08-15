"use client";
import { useState, useCallback } from "react";
import { use } from "react";
import { ArrowLeft, Save, MousePointer2, Plus, Download, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactFlow, { Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function DiagramWorkspace({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params);
  const router = useRouter();
  const { colors, theme } = useTheme();
  
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', type: 'input', data: { label: 'Client' }, position: { x: 250, y: 100 } },
    { id: '2', data: { label: 'SYN' }, position: { x: 250, y: 200 } },
    { id: '3', type: 'output', data: { label: 'Server' }, position: { x: 250, y: 300 } }
  ]);
  
  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true }
  ]);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const generateDiagram = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/diagram/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.diagram) {
        setNodes(data.diagram.nodes || []);
        setEdges(data.diagram.edges || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  return (
    <div className={`flex flex-col h-screen font-sans ${colors.bgApp}`}>
      <div className={`h-14 border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-10 ${colors.bgCard} ${colors.borderBase}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`hover:opacity-70 ${colors.textSecondary}`}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`font-semibold leading-tight ${colors.textPrimary}`}>Flowchart Diagram</h1>
            <span className={`text-[10px] uppercase tracking-wider font-bold ${colors.textSecondary}`}>Flowchart • Editing</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center rounded-lg p-1 mr-4 ${colors.bgInput}`}>
            <input 
              type="text" 
              placeholder="Generate with AI..." 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className={`bg-transparent border-none text-sm px-3 py-1 focus:outline-none w-64 ${colors.textPrimary}`}
            />
            <button 
              onClick={generateDiagram}
              disabled={loading || !prompt.trim()}
              className={`p-1.5 rounded shadow-sm disabled:opacity-50 transition-colors ${colors.bgCard} ${colors.textPrimary} hover:text-violet-500`}
            >
              <Sparkles size={16} className="text-violet-500" />
            </button>
          </div>

          <button className={`p-2 rounded ${colors.textSecondary} ${colors.bgHover}`} title="Download PNG"><Download size={18} /></button>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ml-2 transition-all ${colors.btnPrimary}`}>
            <Save size={16} /> Save
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className={`flex-1 relative ${colors.bgApp}`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background gap={16} size={1} color={theme === 'dark' ? '#333' : '#ddd'} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
