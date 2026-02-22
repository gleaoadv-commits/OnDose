import { Bell, Pill, Users, MapPin, Package, Plus, Clock } from "lucide-react";
import OnDoseIcon from "@/components/OnDoseIcon";

export default function LandingHeroMockup() {
  return (
    <div className="relative w-56 md:w-64">
      {/* Green circle behind */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
      
      {/* Phone frame */}
      <div className="relative bg-card rounded-[2.5rem] shadow-elevated border-[3px] border-foreground/10 p-1.5 z-10">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground/10 rounded-b-2xl z-20" />
        
        {/* Screen */}
        <div className="bg-background rounded-[2rem] p-4 space-y-2.5 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pt-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="gradient-primary rounded-lg p-1 shadow-glow">
                <OnDoseIcon size={16} />
              </div>
              <span className="font-extrabold text-[10px] text-foreground">OnDose</span>
            </div>
            <span className="text-[8px] text-muted-foreground font-semibold">Dashboard</span>
          </div>

          {/* Schedule preview */}
          <div className="bg-primary/5 rounded-xl p-2.5 space-y-1.5">
            <div className="text-[8px] font-bold text-foreground">Próximos horários</div>
            {[
              { name: "Losartana 50mg", time: "08:00" },
              { name: "Metformina 500mg", time: "12:00" },
              { name: "Omeprazol 20mg", time: "20:00" },
            ].map((m) => (
              <div key={m.name} className="flex items-center gap-1.5 bg-card rounded-lg px-2 py-1.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="flex-1 text-[7px] font-semibold text-foreground truncate">{m.name}</span>
                <span className="flex items-center gap-0.5 text-[7px] text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" /> {m.time}
                </span>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { icon: Bell, label: "Lembretes" },
              { icon: Package, label: "Estoque" },
              { icon: Users, label: "Rede Familiar" },
              { icon: MapPin, label: "Farmácias" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 bg-primary/5 rounded-lg px-2 py-1.5">
                <item.icon className="w-3 h-3 text-primary" />
                <span className="text-[7px] font-semibold text-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          {/* FAB */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
