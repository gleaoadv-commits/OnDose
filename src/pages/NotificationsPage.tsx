import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, BellRing } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useApp();

  return (
    <div className="space-y-5">
      <h2 className="section-header">
        <BellRing className="h-5 w-5 text-primary" />
        Notificações
      </h2>

      {notifications.length === 0 ? (
        <Card className="p-10 text-center rounded-2xl border-dashed border-2 border-border/60">
          <div className="bg-muted/50 rounded-3xl p-5 inline-flex mb-3">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <p className="text-elder-base text-muted-foreground">Nenhuma notificação ainda.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Seus alertas aparecerão aqui</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <Card
              key={n.id}
              className={`p-4 flex items-start gap-3 transition-all duration-300 animate-slide-up border-border/40 ${
                n.read ? "opacity-40" : "card-hover border-primary/20"
              }`}
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            >
              <div className={`rounded-xl p-2 shrink-0 mt-0.5 ${n.read ? "bg-muted" : "bg-primary/10"}`}>
                <Bell className={`h-4 w-4 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1">
                <p className="text-elder-sm text-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {new Date(n.time).toLocaleString("pt-BR")}
                </p>
              </div>
              {!n.read && (
                <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)} className="rounded-xl shrink-0">
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
