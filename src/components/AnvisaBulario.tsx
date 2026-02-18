import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, Loader2, AlertCircle, Shield } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface BulaResult {
  idProduto: number;
  nomeProduto: string;
  nomeEmpresa: string;
  numeroRegistro: string;
  expediente: string;
  matchedQuery?: string;
  totalRegistros?: number;
  anvisaUrl: string;
  registroUrl: string | null;
}

interface Props {
  medicationName: string;
}

export default function AnvisaBulario({ medicationName }: Props) {
  const { plan } = useApp();
  const [results, setResults] = useState<BulaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPremium = plan === "premium";

  const handleToggle = async () => {
    if (loading) return;

    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);

    if (searched) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("anvisa-bulario", {
        body: { nomeProduto: medicationName },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      setError("Não foi possível consultar o Bulário da ANVISA agora.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  if (!isPremium) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-5 w-5 text-primary shrink-0" />
          <p className="font-bold text-sm text-foreground">Bulário Eletrônico ANVISA</p>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary px-2 py-0.5 rounded-full">
            Premium
          </span>
        </div>
        <p className="text-xs text-muted-foreground ml-8">
          Acesse a bula oficial deste medicamento diretamente da ANVISA. Disponível no plano Premium.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 rounded-2xl overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/80 transition-colors"
      >
        <BookOpen className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground">Bulário Eletrônico ANVISA</p>
          <p className="text-xs text-muted-foreground">Consultar bula oficial do medicamento</p>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
        ) : expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Consultando ANVISA...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && searched && results.length === 0 && !error && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center py-1">
                Nenhum resultado encontrado para "<strong>{medicationName}</strong>".
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-xl text-xs h-9 gap-1.5"
                onClick={() =>
                  window.open(
                    `https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=${encodeURIComponent(medicationName)}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buscar manualmente na ANVISA
              </Button>
            </div>
          )}

          {results.map((result, idx) => (
            <div key={idx} className="bg-background rounded-xl p-3 border border-border/40 space-y-2.5">
              <div>
                <p className="font-bold text-sm text-foreground">{result.nomeProduto}</p>
                {result.nomeEmpresa && (
                  <p className="text-xs text-muted-foreground">{result.nomeEmpresa}</p>
                )}
                {result.matchedQuery && result.matchedQuery.toUpperCase() !== medicationName.toUpperCase() && (
                  <p className="text-[10px] text-primary/70 mt-0.5 italic">
                    Encontrado como: {result.matchedQuery}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {result.numeroRegistro && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-success" />
                      <p className="text-xs text-muted-foreground">Registro: {result.numeroRegistro}</p>
                    </div>
                  )}
                  {result.totalRegistros && result.totalRegistros > 1 && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      +{result.totalRegistros - 1} outro{result.totalRegistros - 1 > 1 ? "s" : ""} registro{result.totalRegistros - 1 > 1 ? "s" : ""} com este nome
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="rounded-xl text-xs h-8 gap-1.5 flex-1"
                  onClick={() => window.open(result.anvisaUrl, "_blank")}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Ver Bula
                </Button>
                {result.registroUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs h-8 gap-1.5"
                    onClick={() => window.open(result.registroUrl!, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Registro
                  </Button>
                )}
              </div>
            </div>
          ))}

          {results.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center">
              Fonte: Bulário Eletrônico ANVISA — gov.br
            </p>
          )}

          <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed pt-1 border-t border-border/20">
            As informações do Bulário Eletrônico são fornecidas diretamente pela ANVISA. O OnDose não se responsabiliza por eventuais erros, desatualizações ou indisponibilidades neste serviço.
          </p>
        </div>
      )}
    </div>
  );
}
