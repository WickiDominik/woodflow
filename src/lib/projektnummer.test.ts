import { describe, expect, it } from "vitest";
import { istGueltigeProjektnummer } from "./projektnummer";

describe("Projektnummer JJ.NNNN", () => {
  it("akzeptiert 26.0138", () => expect(istGueltigeProjektnummer("26.0138")).toBe(true));
  it("lehnt 26.138 ab", () => expect(istGueltigeProjektnummer("26.138")).toBe(false));
  it("lehnt 2026.0138 ab", () => expect(istGueltigeProjektnummer("2026.0138")).toBe(false));
});
