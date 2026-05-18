import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../context/AuthContext";

export function useIsBeta() {
  const { user } = useAuth();
  const [isBeta, setIsBeta] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsBeta(false);
      setLoading(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "beta" as any)
      .maybeSingle()
      .then(({ data }) => {
        setIsBeta(!!data);
        setLoading(false);
      });
  }, [user]);

  return { isBeta, loading };
}
