import { cn } from "../lib/utils";

interface OnDoseIconProps {
  size?: number;
  className?: string;
}

/**
 * Custom pill icon — capsule with yellow left half and red right half.
 */
export default function OnDoseIcon({ size = 40, className }: OnDoseIconProps) {
  const id = `pill-${size}`;
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
        <linearGradient id={`${id}-yellow`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`${id}-red`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <clipPath id={`${id}-left`}>
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>
        <clipPath id={`${id}-right`}>
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
      </defs>

      {/* Capsule shape — left half yellow */}
      <rect x="15" y="22" width="70" height="56" rx="28" ry="28" fill={`url(#${id}-yellow)`} clipPath={`url(#${id}-left)`} />

      {/* Capsule shape — right half red */}
      <rect x="15" y="22" width="70" height="56" rx="28" ry="28" fill={`url(#${id}-red)`} clipPath={`url(#${id}-right)`} />

      {/* Center divider line */}
      <line x1="50" y1="24" x2="50" y2="76" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />

      {/* Shine highlight */}
      <ellipse cx="38" cy="36" rx="14" ry="5" fill="white" fillOpacity="0.25" transform="rotate(-18, 38, 36)" />
      <ellipse cx="62" cy="36" rx="10" ry="4" fill="white" fillOpacity="0.15" transform="rotate(-18, 62, 36)" />
    </svg>
  );
}
