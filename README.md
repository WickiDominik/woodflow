# Woodflow

Rolle & Ziel

Erstelle einen interaktiven Clickdummy (High-Fidelity Mockup) einer integrierten Projektplattform für den Holzbau, die AVOR, Produktion, Montage und Fertigstellung in einer durchgängigen Oberfläche verbindet.

Der Clickdummy dient zur Visualisierung der Vision für Projektleitung sowie Produktion & Montage.
Es wird keine echte Funktionalität implementiert – alle Inhalte sind Mock-Daten.

1. Grundprinzipien

Fokus auf Big Picture / Vision, nicht auf Detailtiefe

Übersichtlichkeit und Klarheit stehen über Funktionsumfang

Zentrale Rolle des Qualitätsmanagements (QM)

Einheitliche, ruhige neutrale & moderne UI

Deutsche Sprache für sämtliche UI-Texte

2. Plattform-Struktur (Projektbasiert)
Globale Navigation (linke Seitenleiste)

Projektübersicht

Projekt-Dashboard

AVOR

Produktion

Montage

Fertigstellung

QM / Qualität

Zentrale Dateiablage

3. Projekt-Dashboard (Projektgruppiert)
Struktur

Das Dashboard ist nach Projekten gruppiert.
Jedes Projekt wird als eigener Dashboard-Block / Karte dargestellt.

Beispiel-Projekt:

25.0044 – Neubau WDC3 Bern

Projektkarte – Inhalte (Mock)

Jede Projektkarte enthält:

Projektname & Projektnummer

z. B. 25.0044 – Neubau WDC3 Bern

Gesamtstatus Projekt

Visuelle Ampel (Grün / Gelb / Rot)

Fortschritt je Bereich (Balken oder Kreisdiagramm)

AVOR

Produktion

Montage

Fertigstellung

QM-Status

Anzahl offene QM-Punkte

Anzahl freigegebene Elemente

Kritische QM-Punkte hervorgehoben

Direktaktionen (nur Navigation)

„Projekt öffnen“

„QM anzeigen“

„Zum Modell“
4. Bereiche & Unterstrukturen
AVOR

Modell (schematischer 3D-Viewer, Platzhalter)

Terminprogramm

Listen

Pläne

Details

Dateiablage

Bestellungen

Produktion

Modell

Details

Elementpläne

Logistikpläne

Bestellungen

Rüstlisten

Maschinendaten

Montage

Modell

Details

Montagepläne

Logistikpläne

Bestellungen

Tachymeterdaten (Schiftlisten)

Fertigstellung

Modell

Rüstlisten

Bestellungen

Pläne

Alle Inhalte sind lesend / klickbar, aber ohne echte Logik.

5. ZENTRALER KERNPROZESS: QUALITÄTSMANAGEMENT (QM)
QM-Grundidee

QM ist abteilungsübergreifend und elementbasiert organisiert.

Element-Logik (Mock)

QM-Einträge beziehen sich auf:

Einzelne Elemente (z. B. AW_EG_12)

Alternativ: Geschoss & Typ (z. B. AW / EG)

QM-Ansicht

Liste aller QM-Punkte

Filter nach:

Bereich (AVOR / Produktion / Montage)

Status

Element

Status:

Offen

In Bearbeitung

Freigegeben

QM-Freigaben (visuell)

AVOR → Freigabe für Produktion

Produktion → Freigabe für Montage

Freigaben werden nur visuell simuliert (Button / Statuswechsel).

6. Modell-Darstellung

Schematischer 3D-Viewer (Platzhalter)

Keine echte 3D-Interaktion

Markierung von Elementen nur symbolisch

Verknüpfung:

Klick auf Element → zugehörige QM-Einträge sichtbar

7. UX & Präsentationslogik

Klare Hierarchie

Wenige Klicks zu:

Projektstatus

QM-Status

Modell

Ideal für:

interne Präsentationen

Strategie-Workshops

Visionserklärung

Optional:

Präsentationsmodus mit reduzierter Navigation

8. Explizit NICHT umsetzen

Keine echten Uploads

Keine Berechnungen

Keine Benutzerverwaltung

Keine Echtzeit- oder Backend-Logik

Ergebnis

Ein vorzeigbarer Clickdummy, der:

die Vision einer integrierten Holzbau-Plattform zeigt

QM als zentrales Rückgrat verständlich macht

Projekt-, Produktions- und Montageprozesse auf einen Blick erklärt

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e562fa83-22cf-4fd9-90ff-c8a12381eb47).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
