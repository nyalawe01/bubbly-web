"use client";
// components/ui/icons/AnimatedCopyIcon.tsx
//
// Tier-1 animated icon (see components/ui/icons/index.ts): the copy glyph morphs
// into a drawn checkmark when `copied` flips, instead of IconButton's old abrupt
// swap between two separate lucide icons.

import { motion, AnimatePresence } from "framer-motion";

interface AnimatedCopyIconProps {
  size?: number;
  className?: string;
  copied?: boolean;
}

export function AnimatedCopyIcon({ size = 15, className = "", copied = false }: AnimatedCopyIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.path
            key="check"
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        ) : (
          <motion.g
            key="copy"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
          >
            <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth={2} />
            <path
              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}
