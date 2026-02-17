import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pill, CalendarDays, Bell, Crown, Home, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", label: "Início", icon: Home },
  { path: "/calendario", label: "Agenda", icon: CalendarDays },
  { path: "/notificacoes", label: "Alertas", icon: Bell },
  { path: "/planos", label: "Pro", icon: Crown },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { notifications } = useApp();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="gradient-primary px-5 pt-5 pb-6 sticky top-0 z-30 shadow-elevated">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-2.5 shadow-glow">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-elder-lg font-extrabold text-white leading-tight tracking-tight">DoseCerta</h1>
              <p className="text-xs text-white/50 font-medium">Controle inteligente de medicamentos</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {displayName && (
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-white/15 rounded-full p-1.5">
                <User className="h-4 w-4 text-white/80" />
              </div>
              <p className="text-sm text-white/70 font-semibold">
                Olá, <span className="text-white font-bold">{displayName}</span> 👋
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-28 px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-nav z-30 pb-safe">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            const showBadge = path === "/notificacoes" && unreadCount > 0;
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all duration-200 relative ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-2xl transition-all duration-200 relative ${
                  isActive ? "bg-primary/12 scale-110" : ""
                }`}>
                  <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
