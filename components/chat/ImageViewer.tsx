// components/chat/ImageViewer.tsx
"use client";
import { useState } from "react";
import { Download, Maximize2, X } from "lucide-react";

interface ImageViewerProps {
  image: {
    url: string;
    prompt?: string;
  };
}

export function ImageViewer({ image }: ImageViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!image?.url) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = image.url;
    a.download = "bubbly-image.png";
    a.click();
  };

  return (
    <>
      <div className="diagram-container border rounded-xl bg-white/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-400">Generated Image</span>
          <div className="flex items-center gap-1">
            <button onClick={handleDownload} className="icon-motion p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Download">
              <Download size={14} />
            </button>
            <button
              onClick={() => setIsFullscreen(true)}
              className="icon-motion p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.prompt || "Generated image"}
          className="max-w-full max-h-[400px] rounded-lg mx-auto cursor-zoom-in"
          onClick={() => setIsFullscreen(true)}
        />
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-8 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="icon-motion absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.prompt || "Generated image"} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}
