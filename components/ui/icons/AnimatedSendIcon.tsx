"use client";
// components/ui/icons/AnimatedSendIcon.tsx
//
// Tier-1 animated icon: the arrow itself lifts on hover and "launches" (fades
// forward) on tap — the icon's internal path animates, not just IconButton's
// wrapper lift/scale.

import { motion } from "framer-motion";

interface AnimatedSendIconProps {
  size?: number;
  className?: string;
}

export function AnimatedSendIcon({ size = 15, className = "" }: AnimatedSendIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
    >
      <motion.path
        d="M12 19V5M5 12l7-7 7 7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          idle: { y: 0, opacity: 1 },
          hover: { y: -3, opacity: 1 },
          tap: { y: -10, opacity: 0 },
        }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
      />
    </motion.svg>
  );
}
