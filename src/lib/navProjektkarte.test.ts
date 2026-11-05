import * as XLSX from "xlsx";
import { describe, it, expect } from "vitest";
import { parseNavProjektkarte } from "./navProjektkarte";

function wb(blaetter: Record<string, unknown[][]>) {
  const b = XLSX.utils.book_new();
  for (const [n, rows] of Object.entries(blaetter)) {
    XLSX.utils.book_append_sheet(b, XLSX.utils.aoa_to_sheet([["Projektkarte"], [n], ...rows]), n);
  }
  return b;
}

describe("parseNavProjektkarte", () => {
  const datei = wb({
    Allgemein: [["Nr.", "26.0138"], ["Beschreibung", " MFH Rickli Jordy "], ["Status", "Auftrag"], ["Projektleitername", "D. Wicki"], ["Auftragssumme", 100000]],
    Baustelle: [["Lief. an Adresse", "Beundengässli 16"], ["Lief. an PLZ Code/Ort", "2564"], ["Lief. an Ort", "Bellmund"]],
    Bauherr: [["Bauherr Name", "b.o.x. Immobilien"], ["Bauherr Ort", "Biel/Bienne"], ["Status", "anders"], ["Architekt Name", " "]],
  });

  it("liest Felder über alle Blätter", () => {
    const p = parseNavProjektkarte(datei);
    expect(p.nummer).toBe("26.0138");
    expect(p.name).toBe("MFH Rickli Jordy");
    expect(p.bauherr).toBe("b.o.x. Immobilien, Biel/Bienne");
    expect(p.baustelle).toBe("Beundengässli 16, 2564 Bellmund");
    expect(p.ort).toBe("Bellmund");
    expect(p.projektleiter).toBe("D. Wicki");
  });
  it("Baustelle ohne PLZ", () => {
    expect(parseNavProjektkarte(wb({ Allgemein: [["Nr.", "26.0138"], ["Lief. an Adresse", "Weg 1"], ["Lief. an Ort", "Bern"]] })).baustelle).toBe("Weg 1, Bern");
  });
  it("erste Fundstelle gewinnt", () => expect(parseNavProjektkarte(datei).nav_status).toBe("Auftrag"));
  it("Leerzeichen gilt als leer", () => expect(parseNavProjektkarte(datei).architekt).toBeNull());
  it("ungültige Nummer wirft Fehler", () => {
    expect(() => parseNavProjektkarte(wb({ Allgemein: [["Nr.", "P-123"]] }))).toThrow("JJ.NNNN");
  });
});
