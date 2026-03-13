

# Mobile Optimierung & 3D-Modellansicht

## Probleme & Anforderungen
1. **Mobile Responsiveness**: Tabellen/Inhalte werden auf Handys zu breit, keine mobile-optimierte Darstellung
2. **Element-Detail auf Mobile**: Wenn ein Element angeklickt wird, soll ein Info-Drawer/Sheet statt eines Seitenpanels erscheinen
3. **3D-Modellansicht**: ModelViewer soll eine interaktive 3D-Ansicht mit React Three Fiber erhalten, Elemente bleiben klickbar
4. **Gesamte App mobile-optimiert**: Header, Tabs, Tabellen, Dashboard-Karten

## Änderungen

### 1. AppLayout – Mobile Header
- `SelectTrigger` Breite responsive: `w-full sm:w-[320px]`
- Padding `p-3 sm:p-6` auf main

### 2. ModelViewer → 3D mit React Three Fiber
- Install `@react-three/fiber@^8.18`, `three@^0.166`, `@react-three/drei@^9.122.0`
- Neuer `ModelViewer3D` Komponente: Canvas mit OrbitControls, klickbare 3D-Boxen (Wände) farbcodiert nach QM-Status
- Gebäude als gruppierte Meshes (Wände EG, OG1, Dach, Fundament)
- Klick auf Element: auf Mobile → Drawer/Sheet öffnen; auf Desktop → Seitenpanel wie bisher
- `useIsMobile()` Hook steuert ob Sheet oder Seitenpanel

### 3. Alle Seiten – Mobile Tabs
- `TabsList` erhält `flex-wrap` und `h-auto` damit Tabs umbrechen statt zu überflaufen
- Tabellen erhalten `overflow-x-auto` Wrapper

### 4. Dashboard & Projektübersicht
- Grid-Anpassung: `grid-cols-1` auf Mobile statt `grid-cols-2/4`
- QM-Status grid: `grid-cols-1 sm:grid-cols-3`
- Quick-Action Buttons: `flex-wrap` für Mobile

### 5. QM-Seite
- Filter: `flex-wrap` statt nebeneinander
- Freigabe-Workflow: vertikale Darstellung auf Mobile
- Tabelle: horizontales Scrollen

### 6. Bereiche (Produktion, Montage, etc.)
- Tabellen mit `overflow-x-auto` Wrapper
- Grid-Karten: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`

## Technische Details
- Neue Dependency: `@react-three/fiber@^8.18`, `three@^0.166`, `@react-three/drei@^9.122.0`
- Neue Datei: `src/components/ModelViewer3D.tsx` – 3D Canvas mit OrbitControls
- Geänderte Dateien: `ModelViewer.tsx` (ersetzt durch 3D), `AppLayout.tsx`, `Dashboard.tsx`, `Projektuebersicht.tsx`, `QmQualitaet.tsx`, `Avor.tsx`, `Produktion.tsx`, `Montage.tsx`, `Fertigstellung.tsx`, `Dateiablage.tsx`
- Auf Mobile: Element-Klick öffnet ein Sheet/Drawer mit QM-Details statt Seitenpanel

