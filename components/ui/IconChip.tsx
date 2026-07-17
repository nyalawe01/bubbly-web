"use client";
// components/ui/IconChip.tsx
//
// The themed "background" for an icon: a soft accent plate with the accent-color
// icon inside. The icon itself stays transparent (currentColor) — only the chip
// provides color, all from theme tokens (no baked hex). `.theme-swap` is the
// hook the motion phase uses to pop the chip on theme change.
import type { LucideIcon } from "lucide-react";

interface IconChipProps {
  icon?: LucideIcon;
  children?: React.ReactNode;
  size?: number;
  /** chip padding scale (chip box = size * boxScale). */
  boxScale?: number;
  className?: string;
  title?: string;
}

export function IconChip({ icon: Icon, children, size = 16, boxScale = 2, className = "", title }: IconChipProps) {
  const box = Math.round(size * boxScale);
  return (
    <span
      title={title}
      className={`theme-swap inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        background: "var(--accent-soft)",
        color: "var(--accent)",
        borderRadius: "var(--radius-sm)",
        width: box,
        height: box,
      }}
    >
      {Icon ? <Icon size={size} strokeWidth={2} /> : children}
    </span>
  );
}
