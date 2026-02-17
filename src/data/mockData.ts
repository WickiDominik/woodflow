export type StatusAmpel = "green" | "yellow" | "red";
export type QmStatus = "Offen" | "In Bearbeitung" | "Freigegeben";
export type Bereich = "AVOR" | "Produktion" | "Montage" | "Fertigstellung";

export interface Projekt {
  id: string;
  nummer: string;
  name: string;
  status: StatusAmpel;
  fortschritt: { avor: number; produktion: number; montage: number; fertigstellung: number };
  qm: { offen: number; freigegeben: number; kritisch: number };
  beschreibung: string;
}

export interface QmPunkt {
  id: string;
  element: string;
  bereich: Bereich;
  status: QmStatus;
  beschreibung: string;
  prioritaet: "Hoch" | "Mittel" | "Niedrig";
  datum: string;
}

export interface ProduktionsElement {
  id: string;
  bezeichnung: string;
  typ: string;
  geschoss: string;
  status: QmStatus;
  laenge: string;
  hoehe: string;
}

export const projekte: Projekt[] = [
  {
    id: "1",
    nummer: "25.0044",
    name: "Neubau WDC3 Bern",
    status: "green",
    fortschritt: { avor: 95, produktion: 72, montage: 35, fertigstellung: 10 },
    qm: { offen: 5, freigegeben: 42, kritisch: 1 },
    beschreibung: "Wohn- und Dienstleistungscenter, 3 Geschosse Holzbau",
  },
  {
    id: "2",
    nummer: "25.0051",
    name: "MFH Luzern Süd",
    status: "yellow",
    fortschritt: { avor: 80, produktion: 45, montage: 10, fertigstellung: 0 },
    qm: { offen: 12, freigegeben: 28, kritisch: 3 },
    beschreibung: "Mehrfamilienhaus, 4 Geschosse, Hybridbau",
  },
  {
    id: "3",
    nummer: "24.0138",
    name: "Schulhaus Thun",
    status: "red",
    fortschritt: { avor: 100, produktion: 90, montage: 65, fertigstellung: 20 },
    qm: { offen: 18, freigegeben: 55, kritisch: 7 },
    beschreibung: "Erweiterungsbau Primarschule, 2 Geschosse",
  },
  {
    id: "4",
    nummer: "25.0067",
    name: "Bürogebäude Basel",
    status: "green",
    fortschritt: { avor: 60, produktion: 20, montage: 0, fertigstellung: 0 },
    qm: { offen: 3, freigegeben: 15, kritisch: 0 },
    beschreibung: "Bürogebäude mit Holzfassade, 5 Geschosse",
  },
];

export const qmPunkte: QmPunkt[] = [
  { id: "QM-001", element: "AW_EG_01", bereich: "AVOR", status: "Freigegeben", beschreibung: "Elementplan geprüft und freigegeben", prioritaet: "Mittel", datum: "2025-01-15" },
  { id: "QM-002", element: "AW_EG_02", bereich: "AVOR", status: "Freigegeben", beschreibung: "Materialbestellung abgestimmt", prioritaet: "Niedrig", datum: "2025-01-16" },
  { id: "QM-003", element: "AW_EG_03", bereich: "Produktion", status: "In Bearbeitung", beschreibung: "Masskontrolle ausstehend", prioritaet: "Hoch", datum: "2025-01-20" },
  { id: "QM-004", element: "AW_EG_04", bereich: "Produktion", status: "Offen", beschreibung: "Fräsdaten noch nicht übertragen", prioritaet: "Hoch", datum: "2025-01-22" },
  { id: "QM-005", element: "AW_EG_05", bereich: "Produktion", status: "Freigegeben", beschreibung: "Produktion abgeschlossen, Qualität i.O.", prioritaet: "Mittel", datum: "2025-01-18" },
  { id: "QM-006", element: "AW_OG1_01", bereich: "Montage", status: "Offen", beschreibung: "Montagesequenz noch nicht definiert", prioritaet: "Hoch", datum: "2025-02-01" },
  { id: "QM-007", element: "AW_OG1_02", bereich: "Montage", status: "In Bearbeitung", beschreibung: "Kranplanung in Abstimmung", prioritaet: "Mittel", datum: "2025-02-03" },
  { id: "QM-008", element: "DE_EG_01", bereich: "AVOR", status: "Offen", beschreibung: "Anschlussdetails klären", prioritaet: "Hoch", datum: "2025-02-05" },
  { id: "QM-009", element: "DE_EG_02", bereich: "Produktion", status: "In Bearbeitung", beschreibung: "CNC-Programm wird erstellt", prioritaet: "Mittel", datum: "2025-02-06" },
  { id: "QM-010", element: "IW_EG_01", bereich: "AVOR", status: "Freigegeben", beschreibung: "Innenwand geprüft", prioritaet: "Niedrig", datum: "2025-01-10" },
  { id: "QM-011", element: "AW_EG_06", bereich: "Montage", status: "Offen", beschreibung: "Transportlogistik offen", prioritaet: "Mittel", datum: "2025-02-10" },
  { id: "QM-012", element: "AW_EG_07", bereich: "Produktion", status: "Freigegeben", beschreibung: "Element fertig produziert", prioritaet: "Niedrig", datum: "2025-01-25" },
];

export const produktionsElemente: ProduktionsElement[] = [
  { id: "1", bezeichnung: "AW_EG_01", typ: "Aussenwand", geschoss: "EG", status: "Freigegeben", laenge: "3.60m", hoehe: "2.80m" },
  { id: "2", bezeichnung: "AW_EG_02", typ: "Aussenwand", geschoss: "EG", status: "Freigegeben", laenge: "4.20m", hoehe: "2.80m" },
  { id: "3", bezeichnung: "AW_EG_03", typ: "Aussenwand", geschoss: "EG", status: "In Bearbeitung", laenge: "3.90m", hoehe: "2.80m" },
  { id: "4", bezeichnung: "AW_EG_04", typ: "Aussenwand", geschoss: "EG", status: "Offen", laenge: "5.10m", hoehe: "2.80m" },
  { id: "5", bezeichnung: "AW_EG_05", typ: "Aussenwand", geschoss: "EG", status: "Freigegeben", laenge: "3.30m", hoehe: "2.80m" },
  { id: "6", bezeichnung: "AW_EG_06", typ: "Aussenwand", geschoss: "EG", status: "Offen", laenge: "4.50m", hoehe: "2.80m" },
  { id: "7", bezeichnung: "DE_EG_01", typ: "Decke", geschoss: "EG", status: "Offen", laenge: "6.00m", hoehe: "0.24m" },
  { id: "8", bezeichnung: "DE_EG_02", typ: "Decke", geschoss: "EG", status: "In Bearbeitung", laenge: "5.40m", hoehe: "0.24m" },
  { id: "9", bezeichnung: "IW_EG_01", typ: "Innenwand", geschoss: "EG", status: "Freigegeben", laenge: "3.00m", hoehe: "2.80m" },
  { id: "10", bezeichnung: "AW_OG1_01", typ: "Aussenwand", geschoss: "OG1", status: "Offen", laenge: "3.60m", hoehe: "2.60m" },
  { id: "11", bezeichnung: "AW_OG1_02", typ: "Aussenwand", geschoss: "OG1", status: "In Bearbeitung", laenge: "4.20m", hoehe: "2.60m" },
  { id: "12", bezeichnung: "AW_OG1_03", typ: "Aussenwand", geschoss: "OG1", status: "Offen", laenge: "3.90m", hoehe: "2.60m" },
];

export const dateiablage = [
  {
    name: "Pläne",
    dateien: [
      { name: "Grundriss_EG.pdf", groesse: "2.4 MB", datum: "2025-01-10" },
      { name: "Grundriss_OG1.pdf", groesse: "2.1 MB", datum: "2025-01-10" },
      { name: "Schnitt_A-A.pdf", groesse: "1.8 MB", datum: "2025-01-12" },
      { name: "Fassadenplan_Nord.pdf", groesse: "3.2 MB", datum: "2025-01-15" },
    ],
  },
  {
    name: "Statik",
    dateien: [
      { name: "Statikbericht_V2.pdf", groesse: "5.6 MB", datum: "2025-01-08" },
      { name: "Nachweisprotokoll.pdf", groesse: "1.2 MB", datum: "2025-01-20" },
    ],
  },
  {
    name: "Elementpläne",
    dateien: [
      { name: "AW_EG_01_Plan.pdf", groesse: "0.8 MB", datum: "2025-01-14" },
      { name: "AW_EG_02_Plan.pdf", groesse: "0.9 MB", datum: "2025-01-14" },
      { name: "DE_EG_01_Plan.pdf", groesse: "1.1 MB", datum: "2025-01-16" },
    ],
  },
  {
    name: "Fotos",
    dateien: [
      { name: "Baustellenfoto_01.jpg", groesse: "4.2 MB", datum: "2025-02-01" },
      { name: "Baustellenfoto_02.jpg", groesse: "3.8 MB", datum: "2025-02-01" },
    ],
  },
  {
    name: "Protokolle",
    dateien: [
      { name: "Bausitzung_KW03.pdf", groesse: "0.5 MB", datum: "2025-01-17" },
      { name: "Bausitzung_KW05.pdf", groesse: "0.6 MB", datum: "2025-01-31" },
      { name: "QM_Protokoll_Jan.pdf", groesse: "0.4 MB", datum: "2025-02-02" },
    ],
  },
];
