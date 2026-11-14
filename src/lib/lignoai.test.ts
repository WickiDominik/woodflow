import { describe, expect, it } from "vitest";
import { baueAntwort, letztePruefungen, offeneFristen, zaehleStatus } from "../../supabase/functions/_shared/lignoai";

const heute = "2026-11-13";

describe("Lese-Schnittstelle LignoAI", () => {
  it("zählt Elemente je Status, auch die leeren", () => {
    const z = zaehleStatus([{ status: "abbund" }, { status: "abbund" }, { status: "montiert" }]);
    expect(z.abbund).toBe(2);
    expect(z.montiert).toBe(1);
    expect(z.geplant).toBe(0);
  });

  it("liefert nur offene Fristen mit Datum, sortiert, mit Tagen bis zur Frist", () => {
    const f = offeneFristen(
      [
        { typ: "material_bestellt", soll_datum: "2026-11-20", erledigt_am: null, bemerkung: null },
        { typ: "bta", soll_datum: "2026-11-10", erledigt_am: null, bemerkung: "wartet auf Statik" },
        { typ: "details", soll_datum: "2026-11-01", erledigt_am: "2026-11-02", bemerkung: null },
        { typ: "abnahme", soll_datum: null, erledigt_am: null, bemerkung: null },
      ],
      heute,
    );
    expect(f.map((x) => x.typ)).toEqual(["bta", "material_bestellt"]);
    expect(f[0]).toMatchObject({ tage_bis: -3, ueberfaellig: true, bezeichnung: "Bauteilaufbauten (BTA)" });
    expect(f[1]).toMatchObject({ tage_bis: 7, ueberfaellig: false });
  });

  it("nimmt je Bereich die neueste Prüfung und nur deren offene Punkte", () => {
    const p = letztePruefungen([
      {
        bereich: "produktion", status: "WARNUNG", anzahl_ok: 1, anzahl_offen: 1, created_at: "2026-11-12T08:00:00Z", modell: "a.3d",
        punkte: [
          { gruppe: "Listen", pruefung: "Stückliste", status: "OK", hinweis: null },
          { gruppe: "Pläne", pruefung: "Elementpläne", status: "fehlt", hinweis: "Ordner leer" },
        ],
      },
      { bereich: "produktion", status: "FEHLER", anzahl_ok: 0, anzahl_offen: 2, created_at: "2026-11-01T08:00:00Z", modell: null, punkte: [] },
      { bereich: "montage", status: "OK", anzahl_ok: 3, anzahl_offen: 0, created_at: "2026-11-05T08:00:00Z", modell: null, punkte: "kaputt" },
    ]);
    expect(p.map((x) => x.bereich)).toEqual(["montage", "produktion"]);
    expect(p[1].status).toBe("WARNUNG");
    expect(p[1].offene_punkte).toEqual([{ gruppe: "Pläne", pruefung: "Elementpläne", status: "fehlt", hinweis: "Ordner leer" }]);
    expect(p[0].offene_punkte).toEqual([]);
  });

  it("gibt keine Felder weiter, die nicht ausdrücklich vorgesehen sind", () => {
    const projekt = {
      nummer: "26.0138", name: "Tunstetten", ort: "Tunstetten", status: "green", produktionsstart: "2027-01-11", ifc_hochgeladen_am: null,
      bauherr: "geheim", architekt_email: "x@y.ch",
    };
    const a = baueAntwort(projekt, [], [], [], heute);
    expect(Object.keys(a.projekt).sort()).toEqual(["ampel", "ifc_hochgeladen_am", "name", "nummer", "ort", "produktionsstart"]);
    expect(JSON.stringify(a)).not.toContain("geheim");
  });
});
