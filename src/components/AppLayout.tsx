import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pill, CalendarDays, Bell, Crown, Home, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", label: "Início", icon: Home },
  { path: "/calendario", label: "Agenda", icon: CalendarDays },
  { path: "/notificacoes", label: "Alertas", icon: Bell },
  { path: "/planos", label: "Planos", icon: Crown },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <header className="gradient-primary px-4 py-4 flex items-center gap-3 sticky top-0 z-30 shadow-elevated">
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-2.5">
          <Pill className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-elder-lg font-extrabold text-white leading-tight tracking-tight">DoseCerta</h1>
          <p className="text-xs text-white/70 font-medium">Seu controle de medicamentos</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24 px-4 py-5 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav - frosted glass */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border/50 z-30 pb-safe">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all duration-200 ${
                  isActive
                    ? "text-primary scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
