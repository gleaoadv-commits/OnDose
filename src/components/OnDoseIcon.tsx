import { cn } from "@/lib/utils";

interface OnDoseIconProps {
  size?: number;
  className?: string;
}

/**
 * Custom OnDose icon: Letters O and D merged into a pill/capsule shape.
 * The "O" forms the left rounded half, the "D" forms the right half — together they create a capsule.
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
        <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(168, 55%, 38%)" />
          <stop offset="100%" stopColor="hsl(180, 50%, 48%)" />
        </linearGradient>
        <linearGradient id="pillGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(180, 50%, 48%)" />
          <stop offset="100%" stopColor="hsl(168, 55%, 32%)" />
        </linearGradient>
      </defs>

      {/* Pill capsule shape - full rounded rect */}
      <rect x="5" y="20" width="90" height="60" rx="30" ry="30" fill="url(#pillGrad)" />

      {/* Divider line in the middle of the capsule */}
      <line x1="50" y1="20" x2="50" y2="80" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

      {/* Right half overlay - slightly different shade */}
      <clipPath id="rightHalf">
        <rect x="50" y="20" width="45" height="60" />
      </clipPath>
      <rect x="5" y="20" width="90" height="60" rx="30" ry="30" fill="url(#pillGradRight)" clipPath="url(#rightHalf)" />

      {/* Letter O on the left half */}
      <text
        x="28"
        y="58"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="32"
        fontWeight="900"
        fontFamily="'Nunito', sans-serif"
        letterSpacing="-1"
      >
        O
      </text>

      {/* Letter D on the right half */}
      <text
        x="72"
        y="58"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="32"
        fontWeight="900"
        fontFamily="'Nunito', sans-serif"
        letterSpacing="-1"
      >
        D
      </text>
    </svg>
  );
}
