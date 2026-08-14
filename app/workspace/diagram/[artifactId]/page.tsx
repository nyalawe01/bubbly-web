"use client";
import { useState, useCallback } from "react";
import { use } from "react";
import { ArrowLeft, Save, MousePointer2, Plus, Download, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactFlow, { Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";

export default function DiagramWorkspace({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params);
  const router = useRouter();
  
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
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <div className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900 leading-tight">Flowchart Diagram</h1>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Flowchart • Editing</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
            <input 
              type="text" 
              placeholder="Generate with AI..." 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="bg-transparent border-none text-sm px-3 py-1 focus:outline-none w-64"
            />
            <button 
              onClick={generateDiagram}
              disabled={loading || !prompt.trim()}
              className="bg-white p-1.5 rounded shadow-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
            >
              <Sparkles size={16} />
            </button>
          </div>

          <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Download PNG"><Download size={18} /></button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 ml-2">
            <Save size={16} /> Save
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background color="#ccc" gap={16} />
            <Controls />
            <MiniMap nodeStrokeColor={() => '#6366f1'} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
