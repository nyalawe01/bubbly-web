"use client";
// components/ui/ArtLayer.tsx
//
// Background illustrations were removed by request — the app now uses a clean,
// plain background with no animated motifs. This is kept as a no-op component so
// existing call sites (<ArtLayer surface=... />) keep compiling without changes.

interface ArtLayerProps {
  surface: string;
  hero?: boolean;
  count?: number;
  userId?: string;
  className?: string;
}

export function ArtLayer(_props: ArtLayerProps) {
  return null;
}
