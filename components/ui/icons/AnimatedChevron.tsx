"use client";
// components/ui/icons/AnimatedChevron.tsx
//
// Tier-1 animated icon: rotates with a spring instead of a linear CSS
// transition — used anywhere a dropdown/accordion toggle needs an open state.

import { motion } from "framer-motion";

interface AnimatedChevronProps {
  size?: number;
  className?: string;
  open?: boolean;
}

export function AnimatedChevron({ size = 15, className = "", open = false }: AnimatedChevronProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}
