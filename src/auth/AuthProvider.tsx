import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type Rolle = "admin" | "projektleitung" | "avor" | "produktion" | "montage";

interface AuthWert {
  session: Session | null;
  rollen: Rolle[];
  laedt: boolean;
  abmelden: () => Promise<void>;
}

const AuthContext = createContext<AuthWert>({ session: null, rollen: [], laedt: false, abmelden: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [rollen, setRollen] = useState<Rolle[]>([]);
  const [laedt, setLaedt] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLaedt(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setRollen([]);
      return;
    }
    supabase
      .from("user_rollen")
      .select("rolle")
      .eq("user_id", session.user.id)
      .then(({ data }) => setRollen((data ?? []).map((r) => r.rolle as Rolle)));
  }, [session]);

  const abmelden = async () => {
    await supabase?.auth.signOut();
  };

  return <AuthContext.Provider value={{ session, rollen, laedt, abmelden }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Schützt die App, sobald eine Datenbank verbunden ist. Im Demo-Modus ist kein Login nötig. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, laedt } = useAuth();
  const location = useLocation();
  if (!supabase) return <>{children}</>;
  if (laedt) return null;
  if (!session) return <Navigate to="/login" replace state={{ von: location.pathname }} />;
  return <>{children}</>;
}
