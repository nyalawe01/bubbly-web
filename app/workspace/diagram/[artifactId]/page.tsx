"use client";
import { useState, useCallback } from "react";
import { use } from "react";
import { ArrowLeft, Save, MousePointer2, Download, Sparkles, BoxSelect, Link as LinkIcon, Type, Grip, Terminal, Info, LayoutTemplate, Settings2, Hand, Maximize, FileCode2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactFlow, { Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges, Node, Edge, Panel } from "reactflow";
import "reactflow/dist/style.css";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function DiagramWorkspace({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params);
  const router = useRouter();
  const { colors, theme } = useTheme();
  
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', type: 'input', data: { label: 'Auth Service' }, position: { x: 250, y: 100 } },
    { id: '2', data: { label: 'JWT Validation' }, position: { x: 250, y: 200 } },
    { id: '3', type: 'output', data: { label: 'Database' }, position: { x: 250, y: 300 } }
  ]);
  
  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true }
  ]);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState("select");
  const [selectedElement, setSelectedElement] = useState<any>(null);

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

  const explainNode = () => {
    // Mock explanation feature
    alert("AI Explain Engine (Babawatoto Mode):\n\nThis is a standard JWT validation node. It checks the signature of incoming tokens against the public key before allowing access to the Database layer.");
  };

  return (
    <div className={`flex flex-col h-screen font-sans ${colors.bgApp} overflow-hidden`}>
      
      {/* Top Header */}
      <div className={`h-14 border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-20 ${colors.bgCard} ${colors.borderBase}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`hover:opacity-70 transition-opacity ${colors.textSecondary}`}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`font-semibold leading-tight flex items-center gap-2 ${colors.textPrimary}`}>
              System Architecture 
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">.bwa</span>
            </h1>
            <span className={`text-[10px] uppercase tracking-wider font-bold ${colors.textSecondary}`}>Babawatoto Visual Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center rounded-lg p-1 mr-4 ${colors.bgInput}`}>
            <input 
              type="text" 
              placeholder="Prompt to generate..." 
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

          <button className={`p-2 rounded transition-colors ${colors.textSecondary} ${colors.bgHover}`} title="Download PNG"><Download size={18} /></button>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ml-2 transition-all ${colors.btnPrimary}`}>
            <Save size={16} /> Save
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Tool Dock */}
        <div className={`w-14 border-r flex flex-col items-center py-4 gap-2 z-10 shrink-0 ${colors.bgSidebar} ${colors.borderBase}`}>
          {[
            { id: "select", icon: MousePointer2, label: "Select" },
            { id: "pan", icon: Hand, label: "Pan" },
            { id: "node", icon: BoxSelect, label: "Add Node" },
            { id: "edge", icon: LinkIcon, label: "Connect" },
            { id: "text", icon: Type, label: "Text" },
            { id: "template", icon: LayoutTemplate, label: "Templates" }
          ].map(tool => (
            <button 
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              className={`p-2.5 rounded-lg transition-colors ${activeTool === tool.id ? 'bg-violet-500/20 text-violet-500' : `${colors.textSecondary} ${colors.bgHover}`}`}
            >
              <tool.icon size={18} />
            </button>
          ))}
        </div>

        {/* Infinite Canvas */}
        <div className={`flex-1 relative ${colors.bgApp}`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(e, node) => setSelectedElement(node)}
            onPaneClick={() => setSelectedElement(null)}
            fitView
            className="z-0"
          >
            <Background gap={24} size={1} color={theme === 'dark' ? '#333' : '#e5e7eb'} />
            
            <Panel position="bottom-center" className="mb-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg text-xs font-medium backdrop-blur-md ${colors.bgCard} ${colors.borderBase} ${colors.textSecondary}`}>
                <span>Ctrl + Scroll</span> to zoom • <span>Space + Drag</span> to pan
              </div>
            </Panel>
            
          </ReactFlow>
        </div>

        {/* Right Inspector */}
        {selectedElement && (
          <div className={`w-72 border-l flex flex-col z-10 shrink-0 shadow-xl ${colors.bgSidebar} ${colors.borderBase}`}>
            <div className={`p-4 border-b flex items-center justify-between ${colors.borderBase}`}>
              <h3 className={`font-semibold text-sm flex items-center gap-2 ${colors.textPrimary}`}>
                <Settings2 size={16} className="text-violet-500"/> Inspector
              </h3>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-6">
              
              {/* Properties */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${colors.textSecondary}`}>Properties</label>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-[11px] mb-1 ${colors.textSecondary}`}>Label</label>
                    <input 
                      type="text" 
                      defaultValue={selectedElement.data?.label || selectedElement.id}
                      className={`w-full px-2 py-1.5 rounded text-sm border focus:outline-none focus:border-violet-500 ${colors.bgInput} ${colors.borderBase} ${colors.textPrimary}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] mb-1 ${colors.textSecondary}`}>Semantic Type</label>
                    <select className={`w-full px-2 py-1.5 rounded text-sm border focus:outline-none ${colors.bgInput} ${colors.borderBase} ${colors.textPrimary}`}>
                      <option>Service</option>
                      <option>Database</option>
                      <option>Client</option>
                      <option>Cloud Function</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Explain Engine */}
              <div className="pt-4 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1 text-amber-500`}>
                  <Sparkles size={12}/> AI Engine
                </label>
                <button 
                  onClick={explainNode}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors bg-amber-500/10 text-amber-500 hover:bg-amber-500/20`}
                >
                  <Info size={16} /> Explain Component
                </button>
                <p className={`text-[10px] mt-2 text-center ${colors.textSecondary}`}>
                  Powered by Babawatoto Semantic Analysis
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
      
      {/* Bottom Console */}
      <div className={`h-8 border-t flex items-center px-4 shrink-0 text-xs font-mono z-20 ${colors.bgSidebar} ${colors.borderBase} ${colors.textSecondary}`}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Terminal size={12} className="text-emerald-500" /> BWA Compiler: Ready</span>
          <span className="flex items-center gap-1"><FileCode2 size={12} /> Syncing semantic graph...</span>
        </div>
        <div className="ml-auto">
          Nodes: {nodes.length} | Edges: {edges.length}
        </div>
      </div>
      
    </div>
  );
}
