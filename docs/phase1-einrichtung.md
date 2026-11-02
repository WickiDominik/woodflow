# Phase 1 einrichten: Datenbank, Login, Rollen

Ohne Datenbank läuft Woodflow im **Demo-Modus** (Beispieldaten, Hinweis oben rechts). Sobald die
Datenbank verbunden ist, braucht es ein Login und die Daten kommen aus der Datenbank.

## 1. Datenbank aktivieren (Lovable Cloud)

1. Woodflow in Lovable öffnen und **Cloud** aktivieren.
2. Lovable setzt `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` selbst.
3. Das Skript `supabase/migrations/20261102120000_woodflow_fundament.sql` ausführen lassen
   (in Lovable z.B. mit «Führe die Migration im Ordner supabase/migrations aus»).
   Es legt Tabellen, Zugriffsregeln und das Pilotprojekt **26.0138 MFH Rickli Jordy, Tunstetten**
   mit allen Meilensteinen an.

Lokal ohne Lovable: `.env.local` mit diesen zwei Werten anlegen.

## 2. Login mit Microsoft 365

Im Azure-Portal (Entra ID) eine App-Registrierung anlegen:

- Redirect-URI: `https://<projekt>.supabase.co/auth/v1/callback` (steht in den Auth-Einstellungen von Lovable Cloud)
- Kontotyp: nur Konten dieses Organisationsverzeichnisses (schaerholzbau)
- Client-ID, Client-Secret und Tenant-URL (`https://login.microsoftonline.com/<tenant-id>`) in Lovable Cloud
  unter Authentifizierung → Azure eintragen.

Bis das eingerichtet ist, funktioniert die Anmeldung per E-Mail-Link.

## 3. Rollen vergeben

Nach der ersten Anmeldung hat ein Benutzer noch keine Rolle und kann nur lesen. Den ersten Admin
einmal per SQL setzen:

```sql
insert into public.user_rollen (user_id, rolle)
select id, 'admin' from auth.users where email = 'vorname.nachname@schaerholzbau.ch';
```

| Rolle | Darf |
| --- | --- |
| admin | alles, Rollen verwalten |
| projektleitung, avor | Projekte, Meilensteine und Elemente bearbeiten |
| produktion, montage | Element-Status melden, QM-Punkte erfassen |

Alle angemeldeten Mitarbeitenden dürfen alles lesen.

## Datenmodell (nach Arbeitsanweisung Werkplanung)

- `projekte`: Projektnummer, Produktionsstart, Links zu Windream, Nextcloud und Timbar
- `meilensteine`: BTA, Details, Kontrollpläne, Ausführungspläne (spätestens 9 Wochen vor
  Produktionsstart), Material bestellt (6 Wochen), Planung abgeschlossen (2 Wochen),
  Produktionsstart, Aufrichte, Abnahme
- `elemente`: Bauuntergruppe (`AW_EG`), Baugruppe (`AW_EG_01`), Status entlang der Timbar-Abschnitte
  (geplant → freigegeben → Abbund → Zusammenbau → Weinmann → verladen → montiert → abgenommen),
  jede Änderung landet in `element_status_verlauf`
- `qm_punkte`: pro Projekt oder Element
