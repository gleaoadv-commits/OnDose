import { cn } from "@/lib/utils";
import OnDoseIcon from "@/components/OnDoseIcon";

interface OnDoseLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  theme?: "light" | "dark" | "auto";
  className?: string;
}

const sizeConfig = {
  sm: { icon: 28, text: "text-lg", sub: "text-[9px]", gap: "gap-2" },
  md: { icon: 36, text: "text-xl", sub: "text-[10px]", gap: "gap-2.5" },
  lg: { icon: 44, text: "text-2xl", sub: "text-xs", gap: "gap-3" },
  xl: { icon: 64, text: "text-4xl", sub: "text-sm", gap: "gap-4" },
};

export default function OnDoseLogo({
  size = "md",
  variant = "full",
  theme = "auto",
  className,
}: OnDoseLogoProps) {
  const s = sizeConfig[size];

  const isLight = theme === "light";
  const textColor = isLight ? "text-white" : "text-foreground";
  const accentColor = isLight ? "text-white" : "text-primary";
  const subColor = isLight ? "text-white/60" : "text-muted-foreground";

  if (variant === "icon") {
    return <OnDoseIcon size={s.icon} className={className} />;
  }

  const LogoText = () => (
    <span className={cn(s.text, "font-black tracking-tight leading-none", textColor)} style={{ fontFamily: "'Nunito', sans-serif" }}>
      On
      <span className={cn(accentColor)}>Dose</span>
    </span>
  );

  if (variant === "text") {
    return (
      <div className={cn("flex items-center", className)}>
        <LogoText />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <OnDoseIcon size={s.icon} />
      <div className="flex flex-col">
        <LogoText />
        <span className={cn(s.sub, subColor, "font-semibold tracking-wide leading-tight")}>
          Controle de medicamentos
        </span>
      </div>
    </div>
  );
}
