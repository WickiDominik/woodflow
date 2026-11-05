import { describe, it, expect } from "vitest";
import { filtereFristen, fristZustand, tageBis } from "./fristen";

const H = "2026-11-05";
const l = [
  { id: "a", soll_datum: "2026-12-20", erledigt_am: null },
  { id: "b", soll_datum: "2026-11-01", erledigt_am: null },
  { id: "c", soll_datum: "2026-11-20", erledigt_am: null },
  { id: "d", soll_datum: "2026-11-02", erledigt_am: "2026-11-01" },
  { id: "e", soll_datum: null, erledigt_am: null },
];
const ids = (f: Parameters<typeof filtereFristen>[1]) => filtereFristen(l, f, H).map((x) => x.id);

describe("fristen", () => {
  it("Tage negativ wenn überfällig", () => expect(tageBis("2026-11-01", H)).toBe(-4));
  it("Alle offenen: ohne erledigte und ohne Datum, sortiert", () => expect(ids("alle")).toEqual(["b", "c", "a"]));
  it("Überfällig", () => expect(ids("ueberfaellig")).toEqual(["b"]));
  it("Nächste 3 Wochen inkl. überfällige, bis 21 Tage", () => {
    expect(ids("drei_wochen")).toEqual(["b", "c"]);
    expect(filtereFristen([{ soll_datum: "2026-11-26", erledigt_am: null }], "drei_wochen", H)).toHaveLength(1);
    expect(filtereFristen([{ soll_datum: "2026-11-27", erledigt_am: null }], "drei_wochen", H)).toHaveLength(0);
  });
  it("Zustand: heute+7 = diese Woche, +8 = später", () => {
    expect(fristZustand("2026-11-12", H)).toBe("diese_woche");
    expect(fristZustand("2026-11-13", H)).toBe("spaeter");
    expect(fristZustand("2026-11-04", H)).toBe("ueberfaellig");
  });
});
