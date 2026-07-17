"use client";
// components/ui/Logo.tsx
//
// The bubbly logo mark — pure inline SVG, no PNG, no baked hex:
//   plate = var(--accent), glyph = var(--accent-ink).
// The optional wordmark uses var(--font-display) so it re-typesets per theme.
interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* rounded speech-plate */}
      <path
        d="M6 4h20a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H14l-6 5v-5H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        fill="var(--accent)"
      />
      {/* two-bubble glyph in the accent-ink color */}
      <circle cx="13" cy="13" r="3.2" fill="var(--accent-ink)" />
      <circle cx="21" cy="13" r="3.2" fill="var(--accent-ink)" />
    </svg>
  );
}

export function Logo({ size = 28, withWordmark = true, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span
          className="text-[var(--text-primary)] tracking-tight font-medium"
          style={{ fontFamily: "var(--font-display, inherit)", fontSize: size * 0.66 }}
        >
          bubbly
        </span>
      )}
    </span>
  );
}
