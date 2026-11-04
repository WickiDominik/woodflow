import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { filtereTermine, meilensteinDaten, parseTerminprogramm, terminZustand, type Termin } from "./terminprogramm";

function mappe(a1: unknown) {
  const ws = XLSX.utils.aoa_to_sheet([
    [a1],
    [],
    [null, "Aufgabe / Ereignis", "Zuständig", "Start", "Ende"],
    [null, "Freigabe Bauteilaufbauten", "Arch", new Date(2026, 8, 1), new Date(2026, 8, 15)],
    [null, "", "shb", new Date(2026, 8, 2), null],
    [null, "Ohne Start", "shb", null, null],
    [null, " abbund ", "shb", new Date(2027, 0, 11), new Date(2027, 0, 22)],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Terminplan kompakt");
  return wb;
}

describe("parseTerminprogramm", () => {
  it("liest Projektnummer als Text", () => expect(parseTerminprogramm(mappe("26.0138")).nummer).toBe("26.0138"));
  it("formatiert Projektnummer als Zahl mit 4 Stellen", () => expect(parseTerminprogramm(mappe(26.0138)).nummer).toBe("26.0138"));
  it("überspringt Zeilen ohne Aufgabe oder Start und behält die Reihenfolge", () => {
    const t = parseTerminprogramm(mappe("26.0138")).termine;
    expect(t.map((x) => [x.reihenfolge, x.aufgabe])).toEqual([[1, "Freigabe Bauteilaufbauten"], [2, "abbund"]]);
    expect(t[0]).toMatchObject({ zustaendig: "Arch", start: "2026-09-01", ende: "2026-09-15" });
  });
});

describe("meilensteinDaten", () => {
  const t = parseTerminprogramm(mappe("26.0138")).termine;
  const r = meilensteinDaten(t);
  it("BTA aus Ende von «Freigabe Bauteilaufbauten»", () => expect(r.daten.bta).toBe("2026-09-15"));
  it("Produktionsstart aus Start von «Abbund», ohne Gross/Klein und Leerzeichen", () => expect(r.daten.produktionsstart).toBe("2027-01-11"));
  it("listet nicht gefundene Aufgaben", () => {
    expect(r.daten.aufrichte).toBeUndefined();
    expect(r.nichtGefunden).toContain("Montage Holzbau");
    expect(r.nichtGefunden).not.toContain("Abbund");
  });
});

describe("Zustand und Filter", () => {
  const heute = "2026-11-04";
  const t = (start: string, ende: string | null, zustaendig: string | null = "shb"): Termin => ({ reihenfolge: 1, aufgabe: "x", zustaendig, start, ende });
  it("vorbei", () => expect(terminZustand(t("2026-10-01", "2026-11-03"), heute)).toBe("vorbei"));
  it("läuft", () => expect(terminZustand(t("2026-11-01", "2026-11-04"), heute)).toBe("laeuft"));
  it("diese Woche (in 7 Tagen)", () => expect(terminZustand(t("2026-11-11", null), heute)).toBe("diese_woche"));
  it("nichts ab 8 Tagen", () => expect(terminZustand(t("2026-11-12", null), heute)).toBeNull());
  it("Nächste 2 Wochen: bis 14 Tage, nicht 15", () => {
    expect(filtereTermine([t("2026-11-18", null), t("2026-11-19", null)], "zwei_wochen", heute)).toHaveLength(1);
  });
  it("Architekt: nur Arch und nicht vorbei", () => {
    const l = [t("2026-12-01", null, "Arch"), t("2026-10-01", "2026-10-02", "Arch"), t("2026-12-01", null, "shb")];
    expect(filtereTermine(l, "architekt", heute)).toHaveLength(1);
  });
});
