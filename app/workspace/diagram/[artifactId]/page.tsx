"use client";
import { useState, useCallback } from "react";
import { ArrowLeft, Save, MousePointer2, Plus, Download, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useRouter } from "next/navigation";

// Since we cannot install reactflow right now, this is a mock representation 
// of the Diagram Editor canvas for Phase 10.
export default function DiagramWorkspace({ params }: { params: { artifactId: string } }) {
  const { artifactId } = params;
  const router = useRouter();
  
  const [nodes, setNodes] = useState([
    { id: '1', label: 'Client', x: 200, y: 200 },
    { id: '2', label: 'SYN', x: 400, y: 150 },
    { id: '3', label: 'Server', x: 600, y: 200 }
  ]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <div className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900 leading-tight">TCP Handshake Flow</h1>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Flowchart • Saved</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Download PNG"><Download size={18} /></button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 ml-2">
            <Save size={16} /> Save
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Toolbar */}
        <div className="w-16 border-r bg-white shrink-0 flex flex-col items-center py-4 gap-4 z-10">
          <button className="p-3 text-indigo-600 bg-indigo-50 rounded-xl" title="Select"><MousePointer2 size={20} /></button>
          <button className="p-3 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl" title="Add Node"><Plus size={20} /></button>
        </div>

        {/* Canvas Area (Mock) */}
        <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[length:24px_24px] relative overflow-hidden bg-slate-50/50">
          
          <div className="absolute inset-0">
            {/* Draw edges (SVG) */}
            <svg className="w-full h-full absolute top-0 left-0 pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
              </defs>
              <line x1="280" y1="200" x2="380" y2="160" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="480" y1="160" x2="580" y2="200" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
            </svg>
            
            {/* Draw nodes */}
            {nodes.map(n => (
              <div 
                key={n.id} 
                className="absolute w-32 h-16 bg-white border-2 border-indigo-200 rounded-xl shadow-sm flex items-center justify-center font-medium text-gray-800 cursor-move hover:border-indigo-500 hover:shadow-md transition-shadow"
                style={{ left: n.x - 64, top: n.y - 32 }}
              >
                {n.label}
              </div>
            ))}
          </div>

          {/* Bottom Right Controls */}
          <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-white border shadow-sm rounded-lg p-1">
            <button className="p-2 text-gray-500 hover:text-gray-900 rounded"><ZoomOut size={16} /></button>
            <span className="text-xs font-medium text-gray-600 px-2">100%</span>
            <button className="p-2 text-gray-500 hover:text-gray-900 rounded"><ZoomIn size={16} /></button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <button className="p-2 text-gray-500 hover:text-gray-900 rounded"><Maximize size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
