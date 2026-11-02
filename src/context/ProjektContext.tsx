import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useProjekte, type Projekt } from "@/data/repository";

interface ProjektContextWert {
  projekte: Projekt[];
  projekt: Projekt | undefined;
  setProjektId: (id: string) => void;
  laedt: boolean;
  fehler: Error | null;
}

const ProjektContext = createContext<ProjektContextWert | null>(null);
const SPEICHER_KEY = "woodflow.projektId";

function gespeicherteId(): string | null {
  try {
    return localStorage.getItem(SPEICHER_KEY);
  } catch {
    return null;
  }
}

export function ProjektProvider({ children }: { children: ReactNode }) {
  const { data: projekte = [], isLoading, error } = useProjekte();
  const [projektId, setProjektIdState] = useState<string | null>(gespeicherteId);

  const projekt = useMemo(
    () => projekte.find((p) => p.id === projektId) ?? projekte[0],
    [projekte, projektId],
  );

  useEffect(() => {
    if (projekt && projekt.id !== projektId) setProjektIdState(projekt.id);
  }, [projekt, projektId]);

  const setProjektId = (id: string) => {
    setProjektIdState(id);
    try {
      localStorage.setItem(SPEICHER_KEY, id);
    } catch {
      /* Speicher nicht verfügbar, Auswahl gilt nur bis zum Neuladen */
    }
  };

  return (
    <ProjektContext.Provider value={{ projekte, projekt, setProjektId, laedt: isLoading, fehler: error as Error | null }}>
      {children}
    </ProjektContext.Provider>
  );
}

export function useAktivesProjekt() {
  const ctx = useContext(ProjektContext);
  if (!ctx) throw new Error("useAktivesProjekt braucht einen ProjektProvider");
  return ctx;
}
