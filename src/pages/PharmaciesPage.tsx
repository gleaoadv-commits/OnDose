import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, Navigation, Loader2, AlertCircle, Pill, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { supabase } from "../integrations/supabase/client";
import { useApp } from "../context/AppContext";
import { Link } from "react-router-dom";

interface Pharmacy {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  isManipulacao: boolean;
}

export default function PharmaciesPage() {
  const { plan } = useApp();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);

  const fetchPharmacies = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("nearby-pharmacies", {
        body: { lat, lon, radius: 10000 },
      });
      if (fnError) throw fnError;
      setPharmacies(data.pharmacies || []);
    } catch (err: any) {
      setError("Não foi possível buscar farmácias. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationGranted(true);
        fetchPharmacies(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setError("Permissão de localização negada. Ative nas configurações do navegador.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (plan !== "pro" && plan !== "premium") return;
    requestLocation();
  }, [plan]);

  if (plan !== "pro" && plan !== "premium") {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Farmácias Próximas
        </h1>
        <Card className="p-8 text-center rounded-2xl">
          <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-bold text-foreground">Recurso exclusivo do plano Pro</p>
          <p className="text-sm text-muted-foreground mt-1">Faça upgrade para encontrar farmácias próximas a você.</p>
          <Link to="/planos">
            <Button className="mt-4 rounded-2xl">Ver Planos</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Farmácias Próximas
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={requestLocation}
          disabled={loading}
          className="rounded-2xl text-xs"
        >
          <Navigation className="h-3.5 w-3.5 mr-1" />
          Atualizar
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Buscando farmácias num raio de 10km...</p>
        </div>
      )}

      {error && (
        <Card className="p-4 rounded-2xl border-destructive/20 bg-destructive/5 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {!loading && !error && pharmacies.length === 0 && locationGranted && (
        <Card className="p-8 text-center rounded-2xl">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-bold text-foreground">Nenhuma farmácia encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">Não encontramos farmácias em um raio de 10km.</p>
        </Card>
      )}

      {!loading && pharmacies.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{pharmacies.length} farmácia(s) encontrada(s)</p>
          {pharmacies.map((p, i) => (
            <Card
              key={p.id}
              className="p-0 overflow-hidden border-0 shadow-card animate-slide-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            >
              <div className="flex">
                <div className={`w-1.5 self-stretch rounded-l-lg ${p.isManipulacao ? "bg-accent" : "bg-primary"}`} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm">{p.name}</span>
                        {p.isManipulacao && (
                          <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/30 px-2 py-0.5">
                            <Star className="h-2.5 w-2.5 mr-0.5" />
                            Manipulação
                          </Badge>
                        )}
                      </div>
                      {p.address && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {p.address}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs font-semibold text-primary">
                          <Navigation className="h-3 w-3 inline mr-0.5" />
                          {p.distance < 1 ? `${Math.round(p.distance * 1000)}m` : `${p.distance}km`}
                        </span>
                        {p.phone && (
                          <a href={`tel:${p.phone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
                            <Phone className="h-3 w-3" />
                            {p.phone}
                          </a>
                        )}
                        {p.openingHours && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {p.openingHours}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 shrink-0">
                        <Navigation className="h-3 w-3 mr-1" />
                        Ir
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed pt-2 pb-4 px-2">
        Os dados de farmácias próximas são fornecidos por serviços de mapeamento externos. O OnDose não se responsabiliza por informações desatualizadas, incorretas ou indisponibilidade deste serviço.
      </p>
    </div>
  );
}
