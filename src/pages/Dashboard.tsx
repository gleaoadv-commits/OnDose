import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { Plus, Pill, Pause, Play, Square, Clock, Heart, Camera, Users, FileText, Link2, Package, MapPin, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FREQUENCY_LABELS, Medication } from "@/types/medication";
import TodaySchedule from "@/components/TodaySchedule";
import OverdueDoseAlert from "@/components/OverdueDoseAlert";

function MedicationCard({ med, index }: { med: Medication; index: number }) {
  const { pauseMedication, resumeMedication, stopMedication, deleteMedication } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusConfig = {
    ativo: { label: "Ativo", className: "bg-success/15 text-success border-success/30", dot: "bg-success" },
    pausado: { label: "Pausado", className: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning" },
    encerrado: { label: "Encerrado", className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  };

  const status = statusConfig[med.status];

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

          {med.status !== "encerrado" && (
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
  const { medications, canAddMedication, plan, devPlanOverride, setDevPlanOverride, loading } = useApp();
  const [showDevPanel, setShowDevPanel] = useState(false);

  const activeMeds = medications.filter(m => m.status !== "encerrado");
  const endedMeds = medications.filter(m => m.status === "encerrado");

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
      {/* Overdue dose alerts */}
      <OverdueDoseAlert />

      {/* Low stock alerts (Pro+ only) */}
      {(plan === "pro" || plan === "premium") && medications.filter(m => m.status === "ativo" && m.stockCurrent != null && m.stockTotal && (m.stockCurrent / m.stockTotal) <= 0.2).map(med => (
        <Link key={med.id} to={`/medicamento/${med.id}`}>
          <Card className="p-3 rounded-2xl border-destructive/20 bg-destructive/5 flex items-center gap-3 card-hover mb-2">
            <Package className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-destructive">{med.name} — estoque baixo!</p>
              <p className="text-xs text-muted-foreground">{med.stockCurrent} de {med.stockTotal} cápsulas restantes</p>
            </div>
          </Card>
        </Link>
      ))}

      {/* Today's schedule */}
      <TodaySchedule />

      {/* Premium shortcuts */}
      {plan === "premium" && (
        <div className="grid grid-cols-3 gap-3">
          <Link to="/cuidadores">
            <Card className="p-4 rounded-2xl border-amber-500/20 card-hover flex flex-col items-center gap-2 text-center">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-2 shrink-0">
                <Users className="h-4 w-4 text-white" />
              </div>
              <p className="text-[10px] font-bold text-foreground leading-tight">Familiares</p>
            </Card>
          </Link>
          <Link to="/exames">
            <Card className="p-4 rounded-2xl border-amber-500/20 card-hover flex flex-col items-center gap-2 text-center">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-2 shrink-0">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <p className="text-[10px] font-bold text-foreground leading-tight">Exames</p>
            </Card>
          </Link>
          <Link to="/vinculos">
            <Card className="p-4 rounded-2xl border-primary/20 card-hover flex flex-col items-center gap-2 text-center">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-2 shrink-0">
                <Link2 className="h-4 w-4 text-white" />
              </div>
              <p className="text-[10px] font-bold text-foreground leading-tight">Vínculos</p>
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

      {/* Dev test panel */}
      <div className="fixed bottom-20 right-4 z-50">
        {showDevPanel ? (
          <Card className="p-3 rounded-2xl shadow-lg space-y-2 min-w-[160px]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground">🧪 Teste</p>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowDevPanel(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Plano atual: <span className="font-bold text-foreground">{plan}</span></p>
            {(["free", "pro", "premium"] as const).map(p => (
              <Button
                key={p}
                size="sm"
                variant={devPlanOverride === p ? "default" : "outline"}
                className="w-full text-xs rounded-xl h-7"
                onClick={() => setDevPlanOverride(devPlanOverride === p ? null : p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
            {devPlanOverride && (
              <Button size="sm" variant="ghost" className="w-full text-xs rounded-xl h-7 text-muted-foreground" onClick={() => setDevPlanOverride(null)}>
                Resetar
              </Button>
            )}
          </Card>
        ) : (
          <Button size="sm" className="rounded-full h-10 w-10 p-0 shadow-lg" variant="outline" onClick={() => setShowDevPanel(true)}>
            🧪
          </Button>
        )}
      </div>
    </div>
  );
}
