import { cn } from "@/lib/utils";
import { Pill } from "lucide-react";

interface OnDoseLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  theme?: "light" | "dark" | "auto";
  className?: string;
}

const sizeConfig = {
  sm: { icon: "h-5 w-5", iconBox: "p-1.5 rounded-xl", text: "text-lg", sub: "text-[9px]", gap: "gap-2" },
  md: { icon: "h-6 w-6", iconBox: "p-2.5 rounded-2xl", text: "text-xl", sub: "text-[10px]", gap: "gap-2.5" },
  lg: { icon: "h-8 w-8", iconBox: "p-3 rounded-2xl", text: "text-2xl", sub: "text-xs", gap: "gap-3" },
  xl: { icon: "h-12 w-12", iconBox: "p-5 rounded-3xl", text: "text-4xl", sub: "text-sm", gap: "gap-4" },
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
    return (
      <div className={cn("gradient-primary shadow-glow", s.iconBox, className)}>
        <Pill className={cn(s.icon, "text-white")} />
      </div>
    );
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
      <div className={cn("gradient-primary shadow-glow backdrop-blur-sm", s.iconBox)}>
        <Pill className={cn(s.icon, "text-white")} />
      </div>
      <div className="flex flex-col">
        <LogoText />
        <span className={cn(s.sub, subColor, "font-semibold tracking-wide leading-tight")}>
          Controle de medicamentos
        </span>
      </div>
    </div>
  );
}
