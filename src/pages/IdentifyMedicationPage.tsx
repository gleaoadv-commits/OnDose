import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  Loader2,
  Pill,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MedicationResult {
  identified: boolean;
  name?: string;
  dosage?: string;
  form?: string;
  manufacturer?: string;
  description?: string;
  instructions?: string;
  warnings?: string;
  confidence?: string;
}

export default function IdentifyMedicationPage() {
  const { plan } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicationResult | null>(null);

  if (plan !== "pro") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="section-header mb-0">
            <Camera className="h-5 w-5 text-pro" />
            Identificar Medicamento
          </h2>
        </div>
        <Card className="p-6 rounded-2xl border-border/40 text-center space-y-3">
          <Sparkles className="h-10 w-10 text-pro mx-auto" />
          <p className="text-elder-base font-bold text-foreground">Recurso exclusivo PRO</p>
          <p className="text-sm text-muted-foreground">
            Assine o plano PRO para identificar medicamentos por foto usando inteligência artificial.
          </p>
          <Button
            onClick={() => navigate("/planos")}
            className="gradient-pro text-white border-0 rounded-2xl font-bold"
          >
            Ver planos
          </Button>
        </Card>
      </div>
    );
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 10MB)");
      return;
    }

    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to base64 and send to AI
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("identify-medication", {
        body: { imageBase64: base64, mimeType: file.type },
      });

      if (error) {
        console.error("Error:", error);
        toast.error("Erro ao analisar imagem");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar imagem");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const reset = () => {
    setImagePreview(null);
    setResult(null);
  };

  const confidenceColor = (c?: string) => {
    switch (c) {
      case "alta": return "text-success";
      case "média": return "text-amber-500";
      default: return "text-destructive";
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="section-header mb-0">
          <Camera className="h-5 w-5 text-primary" />
          Identificar Medicamento
        </h2>
      </div>

      {/* Camera / Upload area */}
      {!imagePreview && !loading && (
        <Card className="p-6 rounded-2xl border-border/40 border-dashed border-2 space-y-4">
          <div className="text-center space-y-2">
            <div className="bg-primary/10 rounded-2xl p-4 w-fit mx-auto">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <p className="text-elder-base font-bold text-foreground">Tire uma foto do medicamento</p>
            <p className="text-sm text-muted-foreground">
              Aponte a câmera para a embalagem, rótulo ou comprimido
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="rounded-2xl text-elder-sm font-bold h-14"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-5 w-5 mr-2" />
              Câmera
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl text-elder-sm font-bold h-14"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-5 w-5 mr-2" />
              Galeria
            </Button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="p-8 rounded-2xl border-border/40 text-center space-y-4">
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Medicamento"
              className="w-32 h-32 object-cover rounded-2xl mx-auto opacity-70"
            />
          )}
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-elder-base font-bold text-foreground">Analisando imagem...</p>
          </div>
          <p className="text-sm text-muted-foreground">
            A IA está identificando o medicamento
          </p>
        </Card>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4">
          {imagePreview && (
            <Card className="p-3 rounded-2xl border-border/40">
              <img
                src={imagePreview}
                alt="Medicamento"
                className="w-full max-h-48 object-contain rounded-xl"
              />
            </Card>
          )}

          {result.identified ? (
            <Card className="p-5 rounded-2xl border-success/30 border-2 space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-success/10 rounded-xl p-2 mt-0.5">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="text-elder-lg font-extrabold text-foreground">{result.name}</h3>
                  {result.dosage && (
                    <p className="text-sm font-semibold text-primary">{result.dosage}</p>
                  )}
                  <p className={`text-xs font-bold mt-1 ${confidenceColor(result.confidence)}`}>
                    Confiança: {result.confidence}
                  </p>
                </div>
              </div>

              {result.form && (
                <div className="flex items-center gap-2 text-sm">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{result.form}</span>
                </div>
              )}

              {result.manufacturer && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Fabricante:</span> {result.manufacturer}
                </p>
              )}

              {result.description && (
                <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> Sobre
                  </p>
                  <p className="text-sm text-foreground">{result.description}</p>
                </div>
              )}

              {result.instructions && (
                <div className="bg-primary/5 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-primary">Instruções</p>
                  <p className="text-sm text-foreground">{result.instructions}</p>
                </div>
              )}

              {result.warnings && (
                <div className="bg-accent/10 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-accent flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Avisos
                  </p>
                  <p className="text-sm text-foreground">{result.warnings}</p>
                </div>
              )}

              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground text-center">
                  ⚕️ Esta identificação é apenas informativa. Sempre consulte um médico ou farmacêutico.
                </p>
              </div>

              <Button
                onClick={() => {
                  navigate("/novo-medicamento");
                }}
                className="w-full rounded-2xl text-elder-base font-bold"
                size="lg"
              >
                <Pill className="h-4 w-4 mr-2" />
                Cadastrar este medicamento
              </Button>
            </Card>
          ) : (
            <Card className="p-5 rounded-2xl border-destructive/30 border-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-destructive/10 rounded-xl p-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-elder-base font-bold text-foreground">Não identificado</h3>
                </div>
              </div>
              {result.description && (
                <p className="text-sm text-muted-foreground">{result.description}</p>
              )}
            </Card>
          )}

          <Button
            variant="outline"
            onClick={reset}
            className="w-full rounded-2xl text-elder-base font-bold"
            size="lg"
          >
            <Camera className="h-4 w-4 mr-2" />
            Tirar outra foto
          </Button>
        </div>
      )}
    </div>
  );
}
