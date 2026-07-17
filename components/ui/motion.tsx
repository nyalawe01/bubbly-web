// components/ui/motion.tsx
// Reusable animation primitives — mirrors mobile's components/ui/animations.tsx
// so both platforms share the same animation language (reveal on mount, gentle
// idle float, smoother scroll).
"use client";
import { motion, type Variants } from "framer-motion";

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
};

/** Fade + slide up on mount — use for cards/list items/panels appearing. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={revealVariants}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Gentle idle up/down bob — use sparingly, for one or two focal elements (a hero
 *  icon, an empty-state illustration), never on dense lists (motion fatigue). */
export function Float({
  children,
  distance = 6,
  duration = 2.2,
  className = "",
}: {
  children: React.ReactNode;
  distance?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      animate={{ y: [-distance / 2, distance / 2, -distance / 2] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Class name for smooth, momentum-style scroll containers (matches mobile's
 *  SMOOTH_SCROLL_PROPS deceleration feel). Add alongside overflow-y-auto. */
export const SMOOTH_SCROLL_CLASS = "scroll-smooth [scroll-behavior:smooth]";
