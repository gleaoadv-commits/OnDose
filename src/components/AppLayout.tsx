import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pill, CalendarDays, Bell, Crown, Home } from "lucide-react";

const navItems = [
  { path: "/", label: "Início", icon: Home },
  { path: "/calendario", label: "Agenda", icon: CalendarDays },
  { path: "/notificacoes", label: "Alertas", icon: Bell },
  { path: "/planos", label: "Planos", icon: Crown },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <div className="bg-primary rounded-xl p-2">
          <Pill className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-elder-lg font-extrabold text-foreground leading-tight">DoseCerta</h1>
          <p className="text-sm text-muted-foreground">Seu controle de medicamentos</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24 px-4 py-4 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
