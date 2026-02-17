import { cn } from "@/lib/utils";

interface OnDoseIconProps {
  size?: number;
  className?: string;
}

export default function OnDoseIcon({ size = 40, className }: OnDoseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 100"
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
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(168, 55%, 50%)" />
          <stop offset="100%" stopColor="hsl(180, 50%, 42%)" />
        </linearGradient>
      </defs>

      {/* Outer border ring — rounded rectangle (pill marker) */}
      <rect
        x="4" y="10" width="112" height="80" rx="40" ry="40"
        stroke="url(#borderGrad)"
        strokeWidth="3"
        fill="none"
        strokeOpacity="0.5"
      />

      {/* Left half of capsule */}
      <path
        d="M60,18 L60,82 C60,82 12,82 12,50 C12,18 60,18 60,18 Z"
        fill="url(#odLeft)"
      />

      {/* Right half of capsule */}
      <path
        d="M60,18 L60,82 C60,82 108,82 108,50 C108,18 60,18 60,18 Z"
        fill="url(#odRight)"
      />

      {/* Capsule shine highlights */}
      <ellipse cx="42" cy="34" rx="18" ry="6" fill="white" fillOpacity="0.15" transform="rotate(-15, 42, 34)" />
      <ellipse cx="78" cy="34" rx="14" ry="5" fill="white" fillOpacity="0.1" transform="rotate(-15, 78, 34)" />

      {/* Center divider */}
      <line x1="60" y1="20" x2="60" y2="80" stroke="white" strokeOpacity="0.22" strokeWidth="1.2" />

      {/* Left: subtle O — oval ring */}
      <ellipse cx="38" cy="50" rx="12" ry="14" stroke="white" strokeOpacity="0.3" strokeWidth="2.2" fill="none" />

      {/* Right: subtle D — vertical + arc */}
      <path
        d="M76,36 L76,64 C76,64 92,64 92,50 C92,36 76,36 76,36 Z"
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="2.2"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}
