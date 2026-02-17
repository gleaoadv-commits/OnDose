import { cn } from "@/lib/utils";

interface OnDoseIconProps {
  size?: number;
  className?: string;
}

/**
 * OnDose icon: A pill capsule where the left half subtly suggests an "O" (circular cutout)
 * and the right half suggests a "D" (half-circle cutout) — but it reads as a clean pill first.
 */
export default function OnDoseIcon({ size = 40, className }: OnDoseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="odLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(168, 55%, 42%)" />
          <stop offset="100%" stopColor="hsl(174, 52%, 46%)" />
        </linearGradient>
        <linearGradient id="odRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(178, 48%, 38%)" />
          <stop offset="100%" stopColor="hsl(168, 55%, 34%)" />
        </linearGradient>
        <filter id="innerGlow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset dx="0" dy="1" result="offset" />
          <feComposite in="SourceGraphic" in2="offset" operator="over" />
        </filter>
      </defs>

      {/* Left half of capsule */}
      <path
        d="M50,16 L50,84 Q50,84 50,84 L50,84 
           C50,84 16,84 16,50 
           C16,16 50,16 50,16 Z"
        fill="url(#odLeft)"
      />

      {/* Right half of capsule */}
      <path
        d="M50,16 L50,84 
           C50,84 84,84 84,50 
           C84,16 50,16 50,16 Z"
        fill="url(#odRight)"
      />

      {/* Subtle capsule shine */}
      <ellipse cx="38" cy="34" rx="14" ry="6" fill="white" fillOpacity="0.15" transform="rotate(-20, 38, 34)" />
      <ellipse cx="64" cy="34" rx="10" ry="4" fill="white" fillOpacity="0.1" transform="rotate(-20, 64, 34)" />

      {/* Center divider — thin elegant line */}
      <line x1="50" y1="18" x2="50" y2="82" stroke="white" strokeOpacity="0.2" strokeWidth="1.2" />

      {/* Left: subtle O shape — a ring/circle cutout feel */}
      <circle cx="33" cy="50" r="11" stroke="white" strokeOpacity="0.35" strokeWidth="2.5" fill="none" />

      {/* Right: subtle D shape — vertical line + arc */}
      <path
        d="M62,39 L62,61 C62,61 74,61 74,50 C74,39 62,39 62,39 Z"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}
