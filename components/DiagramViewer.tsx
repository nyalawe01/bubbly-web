// components/DiagramViewer.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, Download, Maximize2, Copy } from "lucide-react";

interface DiagramViewerProps {
  diagram: {
    xml?: string;
    svg?: string;
    format?: string;
    mermaid?: string;
    type?: string;
    code?: string;
    language?: string;
  };
}

export function DiagramViewer({ diagram }: DiagramViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const renderDiagram = async () => {
      if (!diagram) return;
      
      // Handle SVG
      if (diagram.svg) {
        setMermaidSvg(diagram.svg);
        return;
      }

      // Handle Mermaid
      if (diagram.mermaid) {
        setIsLoading(true);
        setError(null);
        
        try {
          const mermaidModule = await import('mermaid');
          const mermaid = mermaidModule.default;
          
          const isDark = document.documentElement.classList.contains('dark');
          
          mermaid.initialize({
            theme: isDark ? 'dark' : 'default',
            themeVariables: isDark ? {
              background: '#1a1a1f',
              primaryColor: '#4D6BFE',
              primaryTextColor: '#ffffff',
              primaryBorderColor: '#4D6BFE',
              lineColor: '#6b7280',
              secondaryColor: '#2a2a2f',
              tertiaryColor: '#1a1a1f',
              fontFamily: 'sans-serif'
            } : {
              background: '#ffffff',
              primaryColor: '#4D6BFE',
              primaryTextColor: '#000000',
              primaryBorderColor: '#4D6BFE',
              lineColor: '#6b7280',
              secondaryColor: '#f5f5f7',
              tertiaryColor: '#ffffff',
              fontFamily: 'sans-serif'
            },
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            },
            sequence: {
              useMaxWidth: true,
              showSequenceNumbers: false
            },
            er: {
              useMaxWidth: true
            },
            pie: {
              useMaxWidth: true
            }
          });

          const result = await mermaid.render('mermaid-diagram', diagram.mermaid);
          if (isMounted) {
            setMermaidSvg(result.svg);
          }
        } catch (err: any) {
          console.error('Mermaid render error:', err);
          if (isMounted) {
            setError('Failed to render diagram: ' + (err.message || 'Unknown error'));
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
        return;
      }

      // Handle Code (Chart.js, etc.)
      if (diagram.code) {
        setMermaidSvg(null);
        return;
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [diagram]);

  if (!diagram || (!diagram.xml && !diagram.svg && !diagram.mermaid && !diagram.code)) {
    return null;
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  
  const handleDownload = () => {
    let content = '';
    let mimeType = 'image/svg+xml';
    let filename = 'diagram.svg';
    
    if (diagram.svg || mermaidSvg) {
      content = diagram.svg || mermaidSvg || '';
    } else if (diagram.mermaid) {
      content = diagram.mermaid;
      mimeType = 'text/plain';
      filename = 'diagram.mermaid';
    } else if (diagram.code) {
      content = diagram.code;
      mimeType = 'text/plain';
      filename = 'diagram.txt';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    let content = '';
    if (diagram.mermaid) content = diagram.mermaid;
    else if (diagram.svg || mermaidSvg) content = diagram.svg || mermaidSvg || '';
    else if (diagram.code) content = diagram.code;
    
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-black/90 p-8 flex items-center justify-center' 
    : 'relative';

  return (
    <div className={`diagram-container border rounded-xl bg-white/5 p-4 transition-all ${containerClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">Diagram</span>
          {diagram.type && (
            <span className="text-[10px] px-2 py-0.5 bg-zinc-500/20 rounded-full text-zinc-400">
              {diagram.type}
            </span>
          )}
          {diagram.language && (
            <span className="text-[10px] px-2 py-0.5 bg-zinc-500/20 rounded-full text-zinc-400">
              {diagram.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Copy code">
            <Copy size={14} />
          </button>
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-zinc-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ZoomIn size={14} />
          </button>
          <button onClick={handleDownload} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Download size={14} />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex items-center justify-center overflow-auto min-h-[100px]"
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease'
        }}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Rendering diagram...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : diagram.svg || mermaidSvg ? (
          <div 
            dangerouslySetInnerHTML={{ __html: diagram.svg || mermaidSvg || '' }} 
            className="max-w-full max-h-[400px] mermaid-container"
          />
        ) : diagram.mermaid ? (
          <pre className="text-xs bg-black/30 p-4 rounded-lg overflow-auto max-h-[300px] w-full">
            {diagram.mermaid}
          </pre>
        ) : diagram.code ? (
          <pre className={`text-xs bg-black/30 p-4 rounded-lg overflow-auto max-h-[300px] w-full ${diagram.language || 'text'}`}>
            {diagram.code}
          </pre>
        ) : diagram.xml ? (
          <pre className="text-xs bg-black/30 p-4 rounded-lg overflow-auto max-h-[300px] w-full">
            {diagram.xml}
          </pre>
        ) : null}
      </div>
    </div>
  );
}