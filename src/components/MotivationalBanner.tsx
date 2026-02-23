import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Sparkles } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { INFREQUENT_FREQUENCIES, MedicationFrequency } from "../types/medication";

interface Props {
  medicationName: string;
  frequency: MedicationFrequency;
  dosage: string;
  eventId: string;
}

export default function MotivationalBanner({ medicationName, frequency, dosage, eventId }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isInfrequent = INFREQUENT_FREQUENCIES.includes(frequency);

  useEffect(() => {
    if (!isInfrequent) {
      setLoading(false);
      return;
    }

    const fetchMessage = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("motivational-message", {
          body: { medicationName, frequency, dosage },
        });
        if (!error && data?.message) {
          setMessage(data.message);
        }
      } catch (err) {
        console.error("Error fetching motivational message:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, [eventId]);

  if (!isInfrequent || (!loading && !message)) return null;

  return (
    <Card className="p-4 rounded-2xl border-0 shadow-card bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="gradient-primary rounded-full p-2 shrink-0 shadow-glow">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 bg-primary/10 rounded-full w-3/4 animate-pulse" />
              <div className="h-3 bg-primary/10 rounded-full w-1/2 animate-pulse" />
            </div>
          ) : (
            <p className="text-sm font-semibold text-foreground leading-relaxed">{message}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
