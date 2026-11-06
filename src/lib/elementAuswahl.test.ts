import { describe, expect, it } from "vitest";
import {
  LEERER_FILTER, filtereElemente, filterOptionen, nurSichtbare, umschalten, umschaltenAlleSichtbaren, verlaufUebergaenge,
  type FilterbaresElement,
} from "./elementAuswahl";

const el: FilterbaresElement[] = [
  { id: "1", baugruppe: "AW_EG_01", bauuntergruppe: "AW_EG", typ: "Aussenwand", geschoss: "EG", status: "geplant" },
  { id: "2", baugruppe: "AW_OG1_01", bauuntergruppe: "AW_OG1", typ: "Aussenwand", geschoss: "OG1", status: "abbund" },
  { id: "3", baugruppe: "DE_EG_01", bauuntergruppe: "DE_EG", typ: "Decke", geschoss: "EG", status: "geplant" },
];

describe("filtereElemente", () => {
  it("filtert nach Typ und Status kombiniert", () => {
    expect(filtereElemente(el, { ...LEERER_FILTER, typ: "Aussenwand", status: "geplant" }).map((e) => e.id)).toEqual(["1"]);
  });
  it("sucht im Elementnamen ohne Gross-/Kleinschreibung", () => {
    expect(filtereElemente(el, { ...LEERER_FILTER, suche: "og1" }).map((e) => e.id)).toEqual(["2"]);
  });
  it("filtert nach Geschoss", () => {
    expect(filtereElemente(el, { ...LEERER_FILTER, geschoss: "EG" }).map((e) => e.id)).toEqual(["1", "3"]);
  });
});

describe("Auswahl", () => {
  it("wählt alle sichtbaren aus und behält bestehende Auswahl", () => {
    expect([...umschaltenAlleSichtbaren([{ id: "1" }, { id: "3" }], new Set(["2"]))].sort()).toEqual(["1", "2", "3"]);
  });
  it("wählt alle sichtbaren ab, wenn schon alle gewählt sind", () => {
    expect([...umschaltenAlleSichtbaren([{ id: "1" }], new Set(["1", "2"]))]).toEqual(["2"]);
  });
  it("Einzelumschaltung und Bereinigung auf sichtbare", () => {
    expect([...umschalten(new Set(["1"]), "1")]).toEqual([]);
    expect([...nurSichtbare([{ id: "2" }], new Set(["1", "2"]))]).toEqual(["2"]);
  });
  it("liefert sortierte eindeutige Optionen", () => {
    expect(filterOptionen(el, "typ")).toEqual(["Aussenwand", "Decke"]);
  });
});

describe("verlaufUebergaenge", () => {
  it("leitet den vorherigen Status aus dem älteren Eintrag ab", () => {
    const r = verlaufUebergaenge([
      { status: "geplant" as const, geaendert_am: "2026-01-01T00:00:00Z" },
      { status: "abbund" as const, geaendert_am: "2026-02-01T00:00:00Z" },
    ]);
    expect(r.map((x) => [x.von, x.status])).toEqual([["geplant", "abbund"], [null, "geplant"]]);
  });
});
