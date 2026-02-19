import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Plus, Pill, Pause, Play, Square, Clock, Heart, Camera, Users, FileText, Link2, Package, MapPin, Trash2, Crown, Ban, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FREQUENCY_LABELS, Medication } from "@/types/medication";
import TodaySchedule from "@/components/TodaySchedule";
import OverdueDoseAlert from "@/components/OverdueDoseAlert";
import PlanDowngradeModal from "@/components/PlanDowngradeModal";
import AdherenceStats from "@/components/AdherenceStats";

function MedicationCard({ med, index, onReactivate }: { med: Medication; index: number; onReactivate?: (id: string) => void }) {
  const { pauseMedication, resumeMedication, stopMedication, deleteMedication } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
    ativo: { label: "Ativo", className: "bg-success/15 text-success border-success/30", dot: "bg-success" },
    pausado: { label: "Pausado", className: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning" },
    encerrado: { label: "Encerrado", className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
    inativo_plano: { label: "Inabilitado", className: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  };

  const status = statusConfig[med.status] ?? statusConfig.encerrado;

  return (
    <Card
      className="p-0 overflow-hidden border-0 shadow-card card-hover animate-slide-up"
      style={{ animationDelay: `${index * 70}ms`, animationFillMode: "both" }}
    >
      <div className="flex">
        {/* Color stripe */}
        <div className="w-1.5 self-stretch rounded-l-lg" style={{ backgroundColor: med.color }} />
        
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div
              className="pill-icon rounded-2xl"
              style={{ backgroundColor: med.color + "15", color: med.color }}
            >
              <Pill className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/medicamento/${med.id}`} className="text-elder-base font-bold text-foreground hover:text-primary transition-colors">
                  {med.name}
                </Link>
                <Badge variant="outline" className={status.className + " text-[10px] font-bold px-2 py-0.5"}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1`} />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{med.dosage} — {med.quantity} comp.</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{FREQUENCY_LABELS[med.frequency]}</span>
                <span className="text-border">•</span>
                <span className="font-semibold text-foreground/60">{med.times.join(", ")}</span>
              </div>
            </div>
          </div>

          {med.status !== "encerrado" && med.status !== "inativo_plano" && (
            <div className="flex gap-2 mt-3 ml-[60px]">
              {med.status === "ativo" ? (
                <Button variant="outline" size="sm" onClick={() => pauseMedication(med.id)} className="text-xs rounded-xl border-border/50 h-8">
                  <Pause className="h-3 w-3 mr-1" /> Pausar
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => resumeMedication(med.id)} className="text-xs rounded-xl border-border/50 h-8">
                  <Play className="h-3 w-3 mr-1" /> Retomar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => stopMedication(med.id)} className="text-xs rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 h-8">
                <Square className="h-3 w-3 mr-1" /> Encerrar
              </Button>
            </div>
          )}

          {med.status === "inativo_plano" && (
            <div className="flex gap-2 mt-3 ml-[60px] items-center flex-wrap">
              <Ban className="h-3.5 w-3.5 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-semibold flex-1">Inabilitado — plano gratuito</p>
              {onReactivate ? (
                <Button size="sm" variant="outline" className="text-xs rounded-xl h-8 border-pro/40 text-pro hover:bg-pro/5 gap-1" onClick={() => onReactivate(med.id)}>
                  <Crown className="h-3 w-3" /> Reativar
                </Button>
              ) : (
                <Link to="/planos">
                  <Button size="sm" variant="outline" className="text-xs rounded-xl h-8 border-pro/40 text-pro hover:bg-pro/5 gap-1">
                    <Crown className="h-3 w-3" /> Reativar
                  </Button>
                </Link>
              )}
              {confirmDelete ? (
                <>
                  <span className="text-xs text-destructive font-semibold self-center">Confirmar?</span>
                  <Button variant="outline" size="sm" onClick={() => deleteMedication(med.id)} className="text-xs rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 h-8">
                    <Trash2 className="h-3 w-3 mr-1" /> Excluir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} className="text-xs rounded-xl border-border/50 h-8">
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="text-xs rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 h-8">
                  <Trash2 className="h-3 w-3 mr-1" /> Excluir
                </Button>
              )}
            </div>
          )}

          {med.status === "encerrado" && (
            <div className="flex gap-2 mt-3 ml-[60px]">
              {confirmDelete ? (
                <>
                  <span className="text-xs text-destructive font-semibold self-center">Confirmar exclusão?</span>
                  <Button variant="outline" size="sm" onClick={() => deleteMedication(med.id)} className="text-xs rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 h-8">
                    <Trash2 className="h-3 w-3 mr-1" /> Excluir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} className="text-xs rounded-xl border-border/50 h-8">
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="text-xs rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 h-8">
                  <Trash2 className="h-3 w-3 mr-1" /> Excluir
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { medications, schedule, canAddMedication, plan, loading, subscriptionReady, updateMedication } = useApp();
  const { user } = useAuth();
  const [pendingLinks, setPendingLinks] = useState(0);

  useEffect(() => {
    if (!user || plan !== "premium") return;
    supabase
      .from("family_links")
      .select("id", { count: "exact", head: true })
      .eq("primary_user_id", user.id)
      .eq("status", "pending")
      .then(({ count }) => setPendingLinks(count ?? 0));
  }, [user, plan]);

  const FREE_LIMIT = 2;
  const activeMeds = medications.filter(m => m.status === "ativo" || m.status === "pausado");
  const inactivePlanMeds = medications.filter(m => m.status === "inativo_plano");
  const endedMeds = medications.filter(m => m.status === "encerrado");

  // Show downgrade modal when: free plan AND more than FREE_LIMIT active/paused meds
  // AND user hasn't already made a selection (no inativo_plano meds exist yet)
  const showDowngradeModal = plan === "free" && subscriptionReady && activeMeds.length > FREE_LIMIT && inactivePlanMeds.length === 0 && !loading;
  // Candidates to inabilitar = only "ativo" ones (not paused)
  const downgradeCandidates = activeMeds.filter(m => m.status === "ativo");

  // Reactivate a single medication when user is already on paid plan
  const handleReactivateMed = async (id: string) => {
    await updateMedication(id, { status: "ativo" });
  };

  // Show skeleton while loading data from server
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="h-5 w-40 bg-muted rounded-lg animate-pulse" />
          <div className="h-24 w-full bg-muted rounded-2xl animate-pulse" />
          <div className="h-24 w-full bg-muted rounded-2xl animate-pulse opacity-60" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-24 w-full bg-muted rounded-2xl animate-pulse" />
          <div className="h-24 w-full bg-muted rounded-2xl animate-pulse opacity-60" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Downgrade modal */}
      <PlanDowngradeModal
        open={showDowngradeModal}
        activeMeds={downgradeCandidates}
        freeLimit={FREE_LIMIT}
      />

      {/* Overdue dose alerts */}
      <OverdueDoseAlert />

      {/* Pending family link notifications */}
      {pendingLinks > 0 && (
        <Link to="/vinculos">
          <Card className="p-3 rounded-xl border-amber-500/30 bg-amber-500/8 flex items-center gap-3 card-hover">
            <div className="relative shrink-0">
              <Bell className="h-5 w-5 text-amber-500" />
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingLinks}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                {pendingLinks === 1 ? "1 familiar aguarda aprovação" : `${pendingLinks} familiares aguardam aprovação`}
              </p>
              <p className="text-xs text-muted-foreground">Toque para aprovar ou rejeitar</p>
            </div>
            <Users className="h-4 w-4 text-amber-500 shrink-0" />
          </Card>
        </Link>
      )}

      {/* Adherence streak + weekly summary */}
      {schedule.length > 0 && <AdherenceStats schedule={schedule} />}

      {/* Low stock alerts (all plans) */}
      {medications.filter(m => m.status === "ativo" && m.stockCurrent != null && m.stockTotal && (m.stockCurrent / m.stockTotal) <= 0.2).map(med => {
        const pct = med.stockTotal ? Math.round((med.stockCurrent! / med.stockTotal) * 100) : 0;
        return (
          <Link key={med.id} to={`/medicamento/${med.id}`}>
            <Card className="p-2.5 rounded-xl border-destructive/20 bg-destructive/5 flex items-center gap-2.5 card-hover mb-1.5">
              <Package className="h-4 w-4 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-destructive">{med.name} — estoque baixo!</p>
                <p className="text-[11px] text-muted-foreground">{med.stockCurrent} de {med.stockTotal} cápsulas ({pct}%)</p>
              </div>
            </Card>
          </Link>
        );
      })}

      {/* Today's schedule */}
      <TodaySchedule />

      {/* Premium shortcuts */}
      {plan === "premium" && (
        <div className="grid grid-cols-2 gap-3">
          <Link to="/exames">
            <Card className="p-4 rounded-2xl border-amber-500/20 card-hover flex flex-col items-center gap-2 text-center">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-2 shrink-0">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <p className="text-[10px] font-bold text-foreground leading-tight">Exames</p>
            </Card>
          </Link>
          <Link to="/vinculos">
            <Card className="p-4 rounded-2xl border-amber-500/20 card-hover flex flex-col items-center gap-2 text-center">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-2 shrink-0">
                <Users className="h-4 w-4 text-white" />
              </div>
              <p className="text-[10px] font-bold text-foreground leading-tight">Familiares</p>
            </Card>
          </Link>
        </div>
      )}

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h2 className="section-header">
            <Heart className="h-5 w-5 text-accent" />
            Medicamentos
          </h2>
          <div className="flex gap-2">
            {(plan === "pro" || plan === "premium") && (
              <>
                <Link to="/identificar">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-2xl text-xs font-bold px-3 h-9 border-pro/30 text-pro hover:bg-pro/5"
                  >
                    <Camera className="h-3.5 w-3.5 mr-1" /> Foto IA
                  </Button>
                </Link>
                <Link to="/farmacias">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-2xl text-xs font-bold px-3 h-9 border-pro/30 text-pro hover:bg-pro/5"
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1" /> Farmácias
                  </Button>
                </Link>
              </>
            )}
            <Link to="/novo-medicamento">
              <Button
                size="sm"
                disabled={!canAddMedication()}
                className="rounded-2xl text-xs font-bold shadow-glow px-3 h-9"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Novo
              </Button>
            </Link>
          </div>
        </div>

        {!canAddMedication() && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <span className="text-sm text-destructive font-semibold">
              Limite de 2 medicamentos atingido.
            </span>
            <Link to="/planos" className="text-sm font-bold text-primary underline underline-offset-2 ml-auto whitespace-nowrap">
              Upgrade →
            </Link>
          </div>
        )}

        {activeMeds.length === 0 ? (
          <Card className="p-10 text-center rounded-2xl border-dashed border-2 border-border/50">
            <div className="bg-primary/8 rounded-3xl p-6 inline-flex mb-4">
              <Pill className="h-12 w-12 text-primary animate-float" />
            </div>
            <p className="text-elder-base text-foreground font-bold">Nenhum medicamento cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">Comece adicionando seu primeiro medicamento</p>
            <Link to="/novo-medicamento">
              <Button className="mt-5 text-sm font-bold rounded-2xl shadow-glow px-6" size="lg">
                <Plus className="h-4 w-4 mr-1.5" /> Cadastrar Medicamento
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeMeds.map((med, i) => (
              <MedicationCard key={med.id} med={med} index={i} />
            ))}
          </div>
        )}

        {inactivePlanMeds.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-bold text-destructive/70 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5" /> Inabilitados (plano gratuito)
            </h3>
            <div className="space-y-2 opacity-70">
              {inactivePlanMeds.map((med, i) => (
                <MedicationCard key={med.id} med={med} index={i} onReactivate={plan !== "free" ? handleReactivateMed : undefined} />
              ))}
            </div>
          </div>
        )}

        {endedMeds.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Encerrados</h3>
            <div className="space-y-2 opacity-45">
              {endedMeds.map((med, i) => (
                <MedicationCard key={med.id} med={med} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Support button */}
      <a
        href="https://wa.me/553131579232"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-2xl border border-success/30 bg-success/8 card-hover"
      >
        <div className="bg-success/15 rounded-xl p-2 shrink-0">
          <MessageCircle className="h-5 w-5 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Suporte via WhatsApp</p>
          <p className="text-xs text-muted-foreground">Tire dúvidas ou reporte problemas</p>
        </div>
      </a>

    </div>
  );
}
