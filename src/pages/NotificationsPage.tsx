import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useApp();

  return (
    <div className="space-y-4">
      <h2 className="text-elder-2xl font-bold text-foreground">🔔 Notificações</h2>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-elder-base text-muted-foreground">Nenhuma notificação ainda.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card
              key={n.id}
              className={`p-4 flex items-start gap-3 transition-all ${n.read ? "opacity-50" : "border-primary/30"}`}
            >
              <Bell className={`h-5 w-5 shrink-0 mt-0.5 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
              <div className="flex-1">
                <p className="text-elder-sm text-foreground">{n.message}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(n.time).toLocaleString("pt-BR")}
                </p>
              </div>
              {!n.read && (
                <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>
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
