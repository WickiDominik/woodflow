import { describe, it, expect } from "vitest";
import { faelligAm, fristStatus, sortiereMeilensteine } from "./meilensteine";
import { berechneFortschritt, berechneQm } from "./kennzahlen";

describe("faelligAm", () => {
  const start = "2027-03-01";

  it("leitet die Fristen aus dem Produktionsstart ab", () => {
    expect(faelligAm({ typ: "ausfuehrungsplaene", soll_datum: null }, start)).toBe("2026-12-28");
    expect(faelligAm({ typ: "material_bestellt", soll_datum: null }, start)).toBe("2027-01-18");
    expect(faelligAm({ typ: "planung_abgeschlossen", soll_datum: null }, start)).toBe("2027-02-15");
    expect(faelligAm({ typ: "produktionsstart", soll_datum: null }, start)).toBe(start);
  });

  it("nimmt ein gesetztes Soll-Datum vor der Regel", () => {
    expect(faelligAm({ typ: "material_bestellt", soll_datum: "2027-01-05" }, start)).toBe("2027-01-05");
  });

  it("hat ohne Produktionsstart oder Regel kein Datum", () => {
    expect(faelligAm({ typ: "material_bestellt", soll_datum: null }, null)).toBeNull();
    expect(faelligAm({ typ: "bta", soll_datum: null }, start)).toBeNull();
  });
});

describe("fristStatus", () => {
  const start = "2027-03-01"; // Material bis 2027-01-18
  const m = { typ: "material_bestellt" as const, soll_datum: null, erledigt_am: null };

  it("erkennt erledigt, überfällig, bald und offen", () => {
    expect(fristStatus({ ...m, erledigt_am: "2027-01-10" }, start, "2027-02-01")).toBe("erledigt");
    expect(fristStatus(m, start, "2027-01-19")).toBe("ueberfaellig");
    expect(fristStatus(m, start, "2027-01-18")).toBe("bald");
    expect(fristStatus(m, start, "2027-01-11")).toBe("bald");
    expect(fristStatus(m, start, "2027-01-10")).toBe("offen");
    expect(fristStatus({ ...m, typ: "bta" }, start, "2027-01-10")).toBe("ohne_datum");
  });
});

describe("sortiereMeilensteine", () => {
  it("sortiert nach Projektablauf", () => {
    const s = sortiereMeilensteine([{ typ: "abnahme" }, { typ: "bta" }, { typ: "material_bestellt" }]);
    expect(s.map((x) => x.typ)).toEqual(["bta", "material_bestellt", "abnahme"]);
  });
});

describe("berechneFortschritt", () => {
  it("ist 0 ohne Elemente", () => {
    expect(berechneFortschritt([])).toEqual({ avor: 0, produktion: 0, montage: 0, fertigstellung: 0 });
  });

  it("zählt Elemente ab der jeweiligen Stufe", () => {
    expect(berechneFortschritt(["geplant", "freigegeben", "verladen", "montiert"])).toEqual({
      avor: 75,
      produktion: 50,
      montage: 25,
      fertigstellung: 0,
    });
  });
});

describe("berechneQm", () => {
  it("zählt offene, freigegebene und kritische Punkte", () => {
    expect(
      berechneQm([
        { status: "Offen", prioritaet: "Hoch" },
        { status: "In Bearbeitung", prioritaet: "Mittel" },
        { status: "Freigegeben", prioritaet: "Hoch" },
      ]),
    ).toEqual({ offen: 2, freigegeben: 1, kritisch: 1 });
  });
});
