"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/app/utils/supabase";
import { ArrowLeft, Search, Filter, ZoomIn, ZoomOut, Maximize, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Component
const ConceptNode = ({ data }: any) => {
  const getBgColor = () => {
    switch(data.type) {
      case 'term': return 'bg-blue-100 border-blue-400 text-blue-900';
      case 'process': return 'bg-green-100 border-green-400 text-green-900';
      case 'theory': return 'bg-purple-100 border-purple-400 text-purple-900';
      case 'formula': return 'bg-orange-100 border-orange-400 text-orange-900';
      default: return 'bg-gray-100 border-gray-400 text-gray-900';
    }
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-lg border-2 ${getBgColor()} min-w-[120px] text-center`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="font-bold text-sm">{data.label}</div>
      <div className="text-[10px] opacity-70 uppercase tracking-wider">{data.type || 'concept'}</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
};

const nodeTypes = {
  concept: ConceptNode,
};

export default function KnowledgeGraph({ params }: { params: { notebookId: string } }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadGraph() {
      // In a real implementation, we would fetch documents linked to this notebook
      // and then fetch concepts linked to those documents.
      // For this phase check, we'll fetch all concepts for the user.
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: conceptsData } = await supabase
        .from("concepts")
        .select("*")
        .eq("owner_id", user.user.id)
        .limit(50);
        
      if (!conceptsData || conceptsData.length === 0) {
        // Mock data if empty for demonstration
        const mockNodes = [
          { id: '1', type: 'concept', data: { label: 'Database System', type: 'theory', def: 'An organized collection of data.' }, position: { x: 250, y: 0 } },
          { id: '2', type: 'concept', data: { label: 'B-Tree', type: 'data_structure', def: 'A self-balancing tree data structure.' }, position: { x: 100, y: 150 } },
          { id: '3', type: 'concept', data: { label: 'Indexing', type: 'process', def: 'A data structure technique to efficiently retrieve records.' }, position: { x: 400, y: 150 } },
          { id: '4', type: 'concept', data: { label: 'Query Optimization', type: 'process', def: 'The process of selecting the most efficient execution plan.' }, position: { x: 250, y: 300 } },
        ];
        
        const mockEdges = [
          { id: 'e1-2', source: '1', target: '2', label: 'uses', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e1-3', source: '1', target: '3', label: 'contains', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e2-3', source: '2', target: '3', label: 'implements', markerEnd: { type: MarkerType.ArrowClosed }, animated: true },
          { id: 'e3-4', source: '3', target: '4', label: 'improves', markerEnd: { type: MarkerType.ArrowClosed } },
        ];
        
        setNodes(mockNodes);
        setEdges(mockEdges);
        setLoading(false);
        return;
      }

      // If we had real data, we'd map it here
      // This is a simplified layout algorithm
      const newNodes = conceptsData.map((c, i) => ({
        id: c.id,
        type: 'concept',
        data: { label: c.name, type: c.type, def: c.definition },
        position: { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 }
      }));
      
      // Fetch relationships
      const { data: rels } = await supabase
        .from("concept_relationships")
        .select("*")
        .in("source_concept_id", conceptsData.map(c => c.id));
        
      const newEdges = (rels || []).map(r => ({
        id: r.id,
        source: r.source_concept_id,
        target: r.target_concept_id,
        label: r.relationship_type,
        markerEnd: { type: MarkerType.ArrowClosed }
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      setLoading(false);
    }
    
    loadGraph();
  }, []);

  const onNodeClick = useCallback((event: any, node: any) => {
    setSelectedNode(node);
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    return nodes.map((n) => {
      const isMatch = n.data.label.toLowerCase().includes(searchQuery.toLowerCase());
      return {
        ...n,
        style: { ...n.style, opacity: isMatch ? 1 : 0.2 },
      };
    });
  }, [nodes, searchQuery]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="h-14 bg-white border-b flex items-center px-6 shrink-0 gap-4 justify-between z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity size={18} className="text-indigo-600" />
            Knowledge Map
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none w-64 transition-all"
            />
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border">
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex">
        {/* Graph Canvas */}
        <div className="flex-1 h-full bg-slate-50 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading Knowledge Graph...</div>
          ) : (
            <ReactFlow
              nodes={filteredNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
            >
              <Background color="#e2e8f0" gap={16} />
              <Controls className="bg-white shadow-md border rounded-lg overflow-hidden" />
              <MiniMap 
                nodeStrokeColor={(n) => {
                  if (n.type === 'concept') return '#94a3b8';
                  return '#eee';
                }}
                nodeColor={(n) => {
                  return '#fff';
                }}
              />
            </ReactFlow>
          )}
        </div>
        
        {/* Node Detail Sidebar */}
        {selectedNode && (
          <div className="w-80 bg-white border-l shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-800">Concept Details</h3>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
                <ArrowLeft size={16} className="rotate-180" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-[10px] uppercase font-bold tracking-wider rounded mb-3">
                {selectedNode.data.type || 'Concept'}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedNode.data.label}</h2>
              
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Definition</h4>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedNode.data.def || 'No definition available. The AI is still processing this concept.'}
                </p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Connected Concepts</h4>
                <div className="space-y-2">
                  {edges.filter(e => e.source === selectedNode.id).map(e => {
                    const targetNode = nodes.find(n => n.id === e.target);
                    return (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 italic text-xs">{e.label}</span>
                        <ArrowLeft size={12} className="rotate-180 text-gray-400" />
                        <span className="font-medium text-indigo-600 hover:underline cursor-pointer" onClick={() => setSelectedNode(targetNode)}>
                          {targetNode?.data.label}
                        </span>
                      </div>
                    );
                  })}
                  {edges.filter(e => e.target === selectedNode.id).map(e => {
                    const sourceNode = nodes.find(n => n.id === e.source);
                    return (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 italic text-xs">is {e.label} by</span>
                        <ArrowLeft size={12} className="rotate-180 text-gray-400" />
                        <span className="font-medium text-indigo-600 hover:underline cursor-pointer" onClick={() => setSelectedNode(sourceNode)}>
                          {sourceNode?.data.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <button className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                Find Connection Path
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
