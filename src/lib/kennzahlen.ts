// Fortschritt und QM-Kennzahlen eines Projekts aus seinen Elementen und QM-Punkten.

export type ElementStatus =
  | "geplant"
  | "freigegeben"
  | "abbund"
  | "zusammenbau"
  | "weinmann"
  | "verladen"
  | "montiert"
  | "abgenommen";

export const ELEMENT_STATUS_REIHENFOLGE: ElementStatus[] = [
  "geplant",
  "freigegeben",
  "abbund",
  "zusammenbau",
  "weinmann",
  "verladen",
  "montiert",
  "abgenommen",
];

export const ELEMENT_STATUS_LABEL: Record<ElementStatus, string> = {
  geplant: "Geplant",
  freigegeben: "Freigegeben",
  abbund: "Abbund",
  zusammenbau: "Zusammenbau",
  weinmann: "Weinmann",
  verladen: "Verladen",
  montiert: "Montiert",
  abgenommen: "Abgenommen",
};

export interface Fortschritt {
  avor: number;
  produktion: number;
  montage: number;
  fertigstellung: number;
}

const rang = (s: ElementStatus) => ELEMENT_STATUS_REIHENFOLGE.indexOf(s);

function anteil(status: ElementStatus[], ab: ElementStatus): number {
  if (status.length === 0) return 0;
  const n = status.filter((s) => rang(s) >= rang(ab)).length;
  return Math.round((n / status.length) * 100);
}

/** AVOR = freigegeben, Produktion = verladen, Montage = montiert, Fertigstellung = abgenommen. */
export function berechneFortschritt(status: ElementStatus[]): Fortschritt {
  return {
    avor: anteil(status, "freigegeben"),
    produktion: anteil(status, "verladen"),
    montage: anteil(status, "montiert"),
    fertigstellung: anteil(status, "abgenommen"),
  };
}

export interface QmKennzahlen {
  offen: number;
  freigegeben: number;
  kritisch: number;
}

export function berechneQm(
  punkte: { status: "Offen" | "In Bearbeitung" | "Freigegeben"; prioritaet: "Hoch" | "Mittel" | "Niedrig" }[],
): QmKennzahlen {
  let offen = 0;
  let freigegeben = 0;
  let kritisch = 0;
  for (const p of punkte) {
    if (p.status === "Freigegeben") {
      freigegeben++;
    } else {
      offen++;
      if (p.prioritaet === "Hoch") kritisch++;
    }
  }
  return { offen, freigegeben, kritisch };
}
