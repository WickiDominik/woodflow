import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAktivesProjekt } from "@/context/ProjektContext";
import { istDemoModus } from "@/integrations/supabase/modus";
import { useAuth } from "@/auth/AuthProvider";

export default function AppLayout() {
  const { projekte, projekt, setProjektId, fehler } = useAktivesProjekt();
  const { session, abmelden } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-3 border-b bg-card px-3 sm:px-4">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <Select value={projekt?.id ?? ""} onValueChange={setProjektId}>
              <SelectTrigger className="w-full sm:w-[320px] border-0 bg-transparent font-medium shadow-none">
                <SelectValue placeholder={projekte.length ? "Projekt wählen" : "Noch keine Projekte"} />
              </SelectTrigger>
              <SelectContent>
                {projekte.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nummer} – {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              {istDemoModus && (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800" title="Keine Datenbank verbunden, es werden Beispieldaten angezeigt.">
                  Demo-Modus
                </span>
              )}
              {session && (
                <Button variant="ghost" size="sm" onClick={abmelden} title={session.user.email ?? undefined}>
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Abmelden</span>
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-3 sm:p-6">
            {fehler && (
              <p className="mb-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                Daten konnten nicht geladen werden: {fehler.message}
              </p>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
