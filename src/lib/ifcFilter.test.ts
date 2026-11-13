import { describe, expect, it } from "vitest";
import {
  bestimmeAttribute,
  bugAusBg,
  filterListe,
  isoliere,
  istSichtbar,
  keineAusgeblendet,
  OHNE,
  propArt,
  umschalten,
  type IfcTeilRoh,
} from "./ifcFilter";
import { kategorieVon } from "./ifcMaterial";

const roh = (x: Partial<IfcTeilRoh>): IfcTeilRoh => ({ name: null, ifcTyp: null, material: null, bg: null, bug: null, farbe: null, ...x });

describe("Materialkategorie", () => {
  it.each([
    ["OSB 3 15mm", "osb"],
    ["Holzfaserplatte 60", "holzfaser"],
    ["Pavatex Isolair", "holzfaser"],
    ["Steinwolle Flumroc", "mineralwolle"],
    ["Dämmung", "daemmung"],
    ["Fermacell 15", "gips"],
    ["GKF 12.5", "gips"],
    ["3S-Platte 27", "platte"],
    ["BSH GL24h", "holz"],
    ["C24", "holz"],
    ["Fi/Ta", "holz"],
    ["Stahl S235", "metall"],
    ["Dampfbremse", "folie"],
  ])("%s → %s", (name, kat) => expect(kategorieVon(name)).toBe(kat));

  it("nutzt den IFC-Typ, wenn kein Material bekannt ist", () => {
    expect(kategorieVon(null, "IFCBEAM")).toBe("holz");
    expect(kategorieVon("", "IFCPLATE")).toBe("platte");
    expect(kategorieVon("XYZ", "IFCWALL")).toBe("sonstiges");
  });
});

describe("BG / BUG", () => {
  it("erkennt cadwork-Property-Namen deutsch und englisch", () => {
    expect(propArt("Baugruppe")).toBe("bg");
    expect(propArt("Group")).toBe("bg");
    expect(propArt("Bauuntergruppe")).toBe("bug");
    expect(propArt("Subgroup")).toBe("bug");
    expect(propArt("Material")).toBe("material");
    expect(propArt("Length")).toBeNull();
  });

  it("leitet die BUG aus der BG ab", () => {
    expect(bugAusBg("AW_EG_01")).toBe("AW_EG");
    expect(bugAusBg("DE_EG_01.1")).toBe("DE_EG");
    expect(bugAusBg("Carport")).toBeNull();
  });

  it("nimmt eigene Werte vor Baugruppe vor Woodflow-Element", () => {
    const bg = { name: "AW_EG_02", bg: null, bug: null };
    expect(bestimmeAttribute(roh({ bg: "AW_EG_01", material: "OSB" }), bg, undefined)).toMatchObject({ bg: "AW_EG_01", bug: "AW_EG", kategorie: "osb" });
    expect(bestimmeAttribute(roh({}), bg, { baugruppe: "X_1", bauuntergruppe: "Wand" })).toMatchObject({ bg: "X_1", bug: "Wand" });
    expect(bestimmeAttribute(roh({}), bg, undefined)).toMatchObject({ bg: "AW_EG_02", bug: "AW_EG", material: OHNE });
    expect(bestimmeAttribute(undefined, undefined, undefined)).toMatchObject({ bg: OHNE, bug: OHNE, kategorie: "sonstiges" });
  });
});

describe("Filter", () => {
  const a = [
    bestimmeAttribute(roh({ bg: "AW_EG_10", material: "C24" }), undefined, undefined),
    bestimmeAttribute(roh({ bg: "AW_EG_2", material: "OSB" }), undefined, undefined),
    bestimmeAttribute(roh({ bg: "AW_EG_2", material: "C24" }), undefined, undefined),
    bestimmeAttribute(roh({ material: "C24" }), undefined, undefined),
  ];

  it("listet Werte natürlich sortiert mit Anzahl, (ohne) am Schluss", () => {
    expect(filterListe(a, "bg").map((e) => [e.wert, e.anzahl])).toEqual([["AW_EG_2", 2], ["AW_EG_10", 1], [OHNE, 1]]);
    expect(filterListe(a, "material").find((e) => e.wert === "OSB")?.kategorie).toBe("osb");
  });

  it("blendet aus, isoliert und kombiniert die Filter", () => {
    let aus = umschalten(keineAusgeblendet(), "material", "OSB");
    expect(a.filter((x) => istSichtbar(x, aus))).toHaveLength(3);
    aus = isoliere(aus, "bg", ["AW_EG_2"], ["AW_EG_2", "AW_EG_10", OHNE]);
    expect(a.filter((x) => istSichtbar(x, aus)).map((x) => x.material)).toEqual(["C24"]);
    aus = umschalten(aus, "material", "OSB");
    expect(a.filter((x) => istSichtbar(x, aus))).toHaveLength(2);
  });
});
