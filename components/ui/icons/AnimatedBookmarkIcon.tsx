"use client";
// components/ui/icons/AnimatedBookmarkIcon.tsx
//
// Tier-1 animated icon: fill toggles with a small pop, and the whole glyph
// bounces on activation — for save/favorite-style affordances.

import { motion } from "framer-motion";

interface AnimatedBookmarkIconProps {
  size?: number;
  className?: string;
  active?: boolean;
}

export function AnimatedBookmarkIcon({ size = 15, className = "", active = false }: AnimatedBookmarkIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      initial={false}
      animate={{ scale: active ? [1, 1.25, 1] : 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ fill: active ? "currentColor" : "transparent" }}
        transition={{ duration: 0.2 }}
      />
    </motion.svg>
  );
}
