import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, Bell, Crown, Home, LogOut, User, BarChart3, Calendar } from "lucide-react";
import OnDoseLogo from "@/components/OnDoseLogo";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", label: "Início", icon: Home },
  { path: "/agenda", label: "Agenda", icon: CalendarDays },
  { path: "/calendario", label: "Calendário", icon: Calendar, requiresPlan: true },
  { path: "/notificacoes", label: "Alertas", icon: Bell },
  { path: "/planos", label: "Pro", icon: Crown },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { notifications, plan } = useApp();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const unreadCount = notifications.filter(n => {
    if (n.read) return false;
    // For dose reminders, only count if dose hasn't been taken
    if ((n as any).type === "dose_reminder" && (n as any).eventId) return true;
    // For info notifications, don't count in badge (they're informational)
    if ((n as any).type === "info") return false;
    return true;
  }).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="gradient-primary px-5 pt-5 pb-6 sticky top-0 z-30 shadow-elevated">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <OnDoseLogo size="md" theme="light" className="flex-1" />
            {(plan === "pro" || plan === "premium") && (
              <Link
                to="/relatorios"
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl p-2"
                title="Relatórios"
              >
                <BarChart3 className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/perfil"
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl p-2"
              title="Meu Perfil"
            >
              <User className="h-5 w-5" />
            </Link>
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
              <div>
                <p className="text-sm text-white/70 font-semibold leading-tight">
                  Olá, <span className="text-white font-bold">{displayName}</span> 👋
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block ${
                  plan === "premium"
                    ? "bg-amber-400/25 text-amber-200"
                    : plan === "pro"
                    ? "bg-white/20 text-white/80"
                    : "bg-white/10 text-white/50"
                }`}>
                  {plan === "premium" ? "✦ Premium" : plan === "pro" ? "⚡ Pro" : "Free"}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24 px-4 py-5 max-w-2xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-nav z-30 pb-safe">
        <div className="max-w-2xl mx-auto flex">
          {navItems
            .filter(item => !item.requiresPlan || plan !== "free")
            .map(({ path, label, icon: Icon }) => {
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
