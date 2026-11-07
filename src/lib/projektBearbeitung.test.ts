import { describe, expect, it } from "vitest";
import { darfProjektBearbeiten, externerProjektLink } from "./projektBearbeitung";

describe("Projektbearbeitung", () => {
  it.each(["admin", "projektleitung", "avor"])("erlaubt %s die Bearbeitung", (rolle) => {
    expect(darfProjektBearbeiten([rolle])).toBe(true);
  });
  it.each(["produktion", "montage"])("zeigt für %s keine Bearbeitung", (rolle) => {
    expect(darfProjektBearbeiten([rolle])).toBe(false);
  });
  it("erlaubt keine Bearbeitung ohne Rolle", () => {
    expect(darfProjektBearbeiten([])).toBe(false);
  });
  it("blendet leere Links aus und blockiert ausführbare URLs", () => {
    expect(externerProjektLink(" ")).toBeNull();
    expect(externerProjektLink("javascript:alert(1)")).toBeNull();
    expect(externerProjektLink("https://example.com/projekt")).toBe("https://example.com/projekt");
  });
});