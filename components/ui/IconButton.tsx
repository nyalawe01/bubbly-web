"use client";
// components/ui/IconButton.tsx
//
// The single icon-button component the whole app should use — for
// copy/regenerate/share under chat responses, nav icons, modal close
// buttons, etc. Centralizing this means "make icons feel more premium"
// is a one-file change instead of hunting down every <button><Icon /></button>
// in the codebase.
//
// Motion: on hover it lifts and scales slightly (spring easing), on press it
// compresses — via the `.icon-motion` utility in globals.css. Respects
// prefers-reduced-motion automatically (handled in the CSS, not here).

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "ghost" | "solid" | "danger";
type Size = "sm" | "md" | "lg";

// Tier-1 icons (components/ui/icons/*) take extra state props (copied/active/open)
// beyond what LucideIcon accepts — this union lets IconButton host either.
type IconComponent = LucideIcon | React.ComponentType<{ size?: number; className?: string; [key: string]: any }>;

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconComponent;
  label: string; // required — used for aria-label AND the optional tooltip, so a11y is never an afterthought
  variant?: Variant;
  size?: Size;
  showLabel?: boolean; // renders label as visible text next to the icon (e.g. "Copy", "Regenerate")
  active?: boolean;
  /** Extra props forwarded to a Tier-1 animated icon (e.g. { copied: true }). */
  iconProps?: Record<string, any>;
}

const sizeMap: Record<Size, { box: string; icon: number }> = {
  sm: { box: "w-7 h-7", icon: 13 },
  md: { box: "w-8 h-8 md:w-9 md:h-9", icon: 15 },
  lg: { box: "w-10 h-10 md:w-11 md:h-11", icon: 18 },
};

const variantMap: Record<Variant, string> = {
  ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
  solid: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  danger: "text-[var(--danger)] hover:opacity-80 hover:bg-red-500/10",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon: Icon, label, variant = "ghost", size = "md", showLabel = false, active = false, className = "", iconProps, ...rest },
    ref
  ) => {
    const { box, icon } = sizeMap[size];

    return (
      <button
        ref={ref}
        aria-label={label}
        title={showLabel ? undefined : label}
        className={`icon-lift group relative flex items-center justify-center gap-1.5 rounded-full disabled:opacity-40 disabled:pointer-events-none ${
          showLabel ? "px-2.5 md:px-3 h-8 md:h-9 w-auto" : box
        } ${variantMap[variant]} ${active ? "bg-[var(--bg-active)] text-[var(--text-primary)]" : ""} ${className}`}
        {...rest}
      >
        <Icon size={icon} strokeWidth={2} {...iconProps} />
        {showLabel && <span className="text-[10px] md:text-xs font-medium">{label}</span>}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";