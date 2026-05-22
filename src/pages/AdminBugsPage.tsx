import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Bug, ShieldAlert, CheckCircle2, Clock, User, Check } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { Navigate } from "react-router-dom";

type BugReport = {
  id: string;
  title: string;
  description: string | null;
  page: string | null;
  severity: string;
  status: string;
  created_at: string;
  user_id: string;
  display_name?: string | null;
};

const SEVERITIES: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-blue-500/15 text-blue-700" },
  medium: { label: "Média", color: "bg-amber-500/15 text-amber-700" },
  high: { label: "Alta", color: "bg-orange-500/15 text-orange-700" },
  critical: { label: "Crítica", color: "bg-red-500/15 text-red-700" },
};

export default function AdminBugsPage() {
  const { isAdmin, loading: loadingRole } = useIsAdmin();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("bug_reports" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar bugs:", error);
      setLoading(false);
      return;
    }

    const rows = (data as any[]) || [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
    let namesById: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      (profs || []).forEach((p: any) => {
        namesById[p.user_id] = p.display_name;
      });
    }
    setBugs(rows.map((r) => ({ ...r, display_name: namesById[r.user_id] || null })));
    setLoading(false);
  };

  const resolveBug = async (id: string) => {
    const { error } = await supabase
      .from("bug_reports" as any)
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Erro ao resolver bug:", error);
      return;
    }
    setBugs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "resolved" } : b))
    );
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (loadingRole) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const open = bugs.filter((b) => b.status === "open");
  const resolved = bugs.filter((b) => b.status !== "open");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl">
          <ShieldAlert className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Painel de Bugs</h2>
          <p className="text-xs text-muted-foreground">
            Bugs catalogados pelo time beta
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-foreground">{bugs.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Total
          </p>
        </Card>
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-destructive">{open.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Em aberto
          </p>
        </Card>
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-green-600">{resolved.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Resolvidos
          </p>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-2">
                <Bug className="h-3.5 w-3.5" />
                Em aberto ({open.length})
              </p>
              {open.map((bug) => (
                <AdminBugCard key={bug.id} bug={bug} onResolve={resolveBug} />
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resolvidos ({resolved.length})
              </p>
              {resolved.map((bug) => (
                <AdminBugCard key={bug.id} bug={bug} onResolve={resolveBug} />
              ))}
            </div>
          )}

          {bugs.length === 0 && (
            <Card className="p-6 rounded-2xl text-center text-sm text-muted-foreground">
              Nenhum bug catalogado ainda.
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function AdminBugCard({ bug }: { bug: BugReport }) {
  const sev = SEVERITIES[bug.severity] || SEVERITIES.medium;
  const isResolved = bug.status !== "open";
  return (
    <Card
      className={`p-4 rounded-2xl space-y-2 ${isResolved ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-bold text-foreground ${
              isResolved ? "line-through" : ""
            }`}
          >
            {bug.title}
          </p>
          {bug.description && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
              {bug.description}
            </p>
          )}
        </div>
        <Badge className={`${sev.color} border-0 text-[10px] shrink-0`}>
          {sev.label}
        </Badge>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
        {bug.page && (
          <span className="px-2 py-0.5 bg-muted rounded-full">{bug.page}</span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(bug.created_at).toLocaleDateString("pt-BR")}
        </span>
        {bug.display_name && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {bug.display_name}
          </span>
        )}
      </div>
    </Card>
  );
}
