import { useState } from "react";
import { Navigate } from "react-router-dom";
import { TreePine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  if (!supabase || session) return <Navigate to="/" replace />;

  const mitMicrosoft = async () => {
    setFehler(null);
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "azure",
      options: { scopes: "email", redirectTo: window.location.origin },
    });
    if (error) setFehler(`Microsoft-Anmeldung nicht möglich: ${error.message}`);
  };

  const mitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(null);
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setFehler(error.message);
    else setMeldung("Wir haben dir einen Anmeldelink geschickt. Bitte prüfe dein Postfach.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <TreePine className="mb-2 h-8 w-8 text-primary" />
          <CardTitle>Woodflow</CardTitle>
          <p className="text-sm text-muted-foreground">schaerholzbau Projektplattform</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={mitMicrosoft}>
            Mit Microsoft 365 anmelden
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            oder
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={mitEmail} className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="vorname.nachname@schaerholzbau.ch"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" variant="outline" className="w-full">
              Anmeldelink senden
            </Button>
          </form>
          {meldung && <p className="text-sm text-status-green">{meldung}</p>}
          {fehler && <p className="text-sm text-destructive">{fehler}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
