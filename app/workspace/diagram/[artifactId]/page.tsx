"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase";
import { Paperclip, Mic, Send, MoreVertical, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { UniversalPromptInput } from "@/components/ui/UniversalPromptInput";

export default function VisionDesignWorkspace({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params);
  const router = useRouter();
  const { colors, theme } = useTheme();
  const supabase = createClient();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasDesign, setHasDesign] = useState(artifactId !== 'new');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const { data } = await supabase
        .from("notebook_assets")
        .select("id, title, updated_at")
        .eq("user_id", user.user.id)
        .eq("type", "diagram")
        .order("updated_at", { ascending: false });
      
      if (data && data.length > 0) {
        setHistory(data);
      } else {
        setSidebarOpen(false);
      }
    }
    loadHistory();
  }, [supabase]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleSend = async () => {
    if (!input.trim() || generating) return;
    setGenerating(true);
    
    try {
      if (artifactId === 'new') {
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user) return;

        // Lazy DB Creation: Now we create the row because the user searched/prompted
        const { data, error } = await supabase
          .from('notebook_assets')
          .insert({
            user_id: user.user.id,
            type: 'diagram',
            title: input.slice(0, 30) + '...',
            status: 'ready',
            content: { prompt: input } // Mock initial payload
          })
          .select()
          .single();
        
        if (data && !error) {
          router.replace(`/workspace/diagram/${data.id}`);
          setHasDesign(true);
        }
      } else {
        // Just mock updating the existing design
        setHasDesign(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
      setInput("");
    }
  };

  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden ${colors.bgApp}`}>
      
      {/* Collapsible History Sidebar */}
      {history.length > 0 && sidebarOpen && (
        <div className={`w-72 border-r shrink-0 flex flex-col z-20 shadow-xl transition-all duration-300 ${colors.bgSidebar} ${colors.borderBase}`}>
          <div className={`h-16 flex items-center px-4 border-b ${colors.borderBase}`}>
            <h2 className={`font-semibold text-sm ${colors.textPrimary}`}>Design History</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.map(item => (
              <div 
                key={item.id}
                onClick={() => router.push(`/workspace/diagram/${item.id}`)}
                className={`p-3 border rounded-xl cursor-pointer transition-all ${artifactId === item.id ? 'border-violet-500 bg-violet-500/10' : `${colors.borderBase} ${colors.bgCard} hover:border-violet-500/50`}`}
              >
                {/* Mock Thumbnail */}
                <div className="w-full h-24 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 mb-3 border border-white/5"></div>
                <h3 className={`text-sm font-medium truncate ${colors.textPrimary}`}>{item.title}</h3>
                <p className={`text-[10px] mt-1 ${colors.textSecondary}`}>
                  {new Date(item.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Working Area */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="flex-1 relative flex flex-col items-center justify-center"
      >
        {/* Dense Dot Background */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `radial-gradient(${theme === 'dark' ? '#fff' : '#000'} 1px, transparent 1px)`,
            backgroundSize: '12px 12px'
          }}
        ></div>

        {/* Cursor Spotlight Overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, ${theme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)'}, transparent 80%)`
          }}
        ></div>

        {/* Top Navigation Bar (Floating) */}
        <div className={`absolute top-0 left-0 w-full h-16 px-6 flex items-center justify-between z-20 bg-gradient-to-b from-${theme === 'dark' ? 'black/50' : 'white/50'} to-transparent backdrop-blur-sm pointer-events-auto`}>
          <div className="flex items-center gap-4">
            {history.length > 0 && (
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors ${colors.textSecondary} ${colors.bgHover}`}
              >
                <LayoutDashboard size={20} />
              </button>
            )}
            <h1 className={`font-bold text-lg tracking-tight ${colors.textPrimary}`}>Vision Design</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className={`p-2 rounded-full transition-colors ${colors.textSecondary} ${colors.bgHover}`}>
              <MoreVertical size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg border border-white/20 cursor-pointer hover:scale-105 transition-transform"></div>
          </div>
        </div>

        {/* Central Chat / Action Area */}
        <div className={`relative z-10 w-full max-w-2xl px-6 transition-all duration-700 ${hasDesign ? 'translate-y-[35vh]' : 'translate-y-0'}`}>
          
          {hasDesign && (
            <div className="absolute -top-[45vh] left-1/2 -translate-x-1/2 w-full h-[40vh] border-2 border-dashed border-violet-500/30 rounded-2xl flex items-center justify-center bg-violet-500/5 backdrop-blur-sm">
              <p className={`text-sm font-medium ${colors.textSecondary}`}>Mock Design Canvas Layer</p>
            </div>
          )}

          <div className="w-full relative z-10">
            <UniversalPromptInput 
              value={input}
              onChange={setInput}
              onSubmit={handleSend}
              placeholder="Describe the interface or architecture you want to build..."
              isGenerating={generating}
              showAttach={true}
              showMic={true}
              size="lg"
            />
          </div>
          
          <div className="text-center mt-4">
            <p className={`text-[11px] font-medium tracking-wide uppercase opacity-50 ${colors.textSecondary}`}>
              Babawatoto Semantic Engine
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
