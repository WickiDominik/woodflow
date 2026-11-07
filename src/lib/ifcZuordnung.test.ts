import { describe, expect, it } from "vitest";
import { globalIdZuUuid, legende, normiereGuid, ordneZu, uuidZuGlobalId, type IfcBaugruppe } from "./ifcZuordnung";

describe("GUID-Umrechnung", () => {
  it("bekannte Paare", () => {
    expect(uuidZuGlobalId("00000000-0000-0000-0000-000000000000")).toBe("0000000000000000000000");
    expect(uuidZuGlobalId("ffffffff-ffff-ffff-ffff-ffffffffffff")).toBe("3$$$$$$$$$$$$$$$$$$$$$");
    expect(globalIdZuUuid("3$$$$$$$$$$$$$$$$$$$$$")).toBe("ffffffff-ffff-ffff-ffff-ffffffffffff");
    expect(uuidZuGlobalId("00000000-0000-0000-0000-000000000040")).toBe("0000000000000000000010");
  });
  it("Hin und zurück, Grossbuchstaben egal", () => {
    const u = "2F4E1C3A-9B7D-4E21-8C0F-1A2B3C4D5E6F";
    expect(globalIdZuUuid(uuidZuGlobalId(u))).toBe(u.toLowerCase());
    expect(normiereGuid(u)).toBe(normiereGuid(uuidZuGlobalId(u)));
    expect(normiereGuid("kaputt")).toBeNull();
  });
});

describe("Zuordnung", () => {
  const gid = uuidZuGlobalId("2f4e1c3a-9b7d-4e21-8c0f-1a2b3c4d5e6f");
  const bg: IfcBaugruppe[] = [
    { expressId: 1, globalId: gid, name: "falsch", baugruppeProp: null, teile: [1, 11, 12] },
    { expressId: 2, globalId: "0000000000000000000001", name: "aw_eg_02", baugruppeProp: null, teile: [2, 21] },
    { expressId: 3, globalId: "0000000000000000000002", name: null, baugruppeProp: "AW_EG_03", teile: [3] },
    { expressId: 4, globalId: "0000000000000000000003", name: "XYZ", baugruppeProp: null, teile: [4] },
  ];
  const el = [
    { id: "a", baugruppe: "AW_EG_01", cadwork_guid: "2F4E1C3A-9B7D-4E21-8C0F-1A2B3C4D5E6F", status: "montiert" as const },
    { id: "b", baugruppe: "AW_EG_02", cadwork_guid: null, status: "geplant" as const },
    { id: "c", baugruppe: "AW_EG_03", status: "montiert" as const },
  ];
  it("GUID zuerst, dann Name, dann Property", () => {
    const z = ordneZu(bg, el);
    expect(z.teilZuElement.get(12)?.id).toBe("a");
    expect(z.teilZuElement.get(21)?.id).toBe("b");
    expect(z.teilZuElement.get(3)?.id).toBe("c");
    expect(z.teilZuElement.has(4)).toBe(false);
  });
  it("Legende zählt je Status und nicht zugeordnete", () => {
    const l = legende(bg, ordneZu(bg, el));
    expect(l.proStatus).toEqual({ montiert: 2, geplant: 1 });
    expect(l.nichtZugeordnet).toBe(1);
  });
});
