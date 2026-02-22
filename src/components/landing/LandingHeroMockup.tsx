import { Bell, Pill, Users, MapPin, Package, Plus, Clock } from "lucide-react";
import OnDoseIcon from "@/components/OnDoseIcon";

export default function LandingHeroMockup() {
  return (
    <div className="relative w-64 md:w-72">
      {/* Soft green circle behind */}
      <div className="absolute -right-10 -top-10 w-72 h-72 bg-primary/10 rounded-full blur-2xl" />
      <div className="relative bg-card rounded-[2rem] shadow-elevated border border-border/20 p-5 space-y-3 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="gradient-primary rounded-xl p-1.5 shadow-glow">
              <OnDoseIcon size={22} />
            </div>
            <span className="font-extrabold text-sm text-foreground">OnDose</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Dashboard</span>
        </div>

        {/* Schedule preview */}
        <div className="bg-primary/5 rounded-2xl p-3 space-y-2">
          <div className="text-xs font-bold text-foreground">Próximos horários</div>
          {[
            { name: "Losartana 50mg", time: "08:00" },
            { name: "Metformina 500mg", time: "12:00" },
            { name: "Omeprazol 20mg", time: "20:00" },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="flex-1 text-xs font-semibold text-foreground truncate">{m.name}</span>
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" /> {m.time}
              </span>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Bell, label: "Lembretes" },
            { icon: Package, label: "Estoque" },
            { icon: Users, label: "Rede Familiar" },
            { icon: MapPin, label: "Farmácias" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 bg-primary/5 rounded-xl px-3 py-2">
              <item.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* FAB */}
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
