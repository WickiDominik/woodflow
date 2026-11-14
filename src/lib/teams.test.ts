import { describe, expect, it, vi } from "vitest";
import { faelligeFristen, fristenKarte, heuteZuerich, offenSignatur, pruefungKarte, sendeAnTeams } from "../../supabase/functions/_shared/teams";

const heute = "2026-11-13";
const z = (nummer: string, typ: string, soll: string | null, erledigt: string | null = null) => ({
  projekt_nummer: nummer, projekt_name: `Projekt ${nummer}`, typ, soll_datum: soll, erledigt_am: erledigt,
});
const inhalt = (k: unknown) => JSON.stringify(k);

describe("Teams-Meldungen", () => {
  const zeilen = [
    z("26.0138", "material_bestellt", "2026-11-20"),
    z("26.0095", "bta", "2026-11-10"),
    z("26.0138", "details", "2026-11-01", "2026-11-02"),
    z("26.0138", "abnahme", "2026-12-24"),
    z("26.0138", "aufrichte", null),
    z("26.0095", "kontrollplaene", "2026-11-13"),
  ];

  it("nimmt nur offene Fristen bis in 7 Tagen, älteste zuerst", () => {
    const f = faelligeFristen(zeilen, heute);
    expect(f.map((x) => [x.projekt_nummer, x.tage_bis])).toEqual([["26.0095", -3], ["26.0095", 0], ["26.0138", 7]]);
  });

  it("baut die Fristenkarte mit überfällig und bald fällig", () => {
    const k = fristenKarte(faelligeFristen(zeilen, heute), heute, "https://woodflow.example/");
    const t = inhalt(k);
    expect(t).toContain("Fristen am 13.11.2026");
    expect(t).toContain("Überfällig (1)");
    expect(t).toContain("seit 3 Tagen überfällig");
    expect(t).toContain("heute fällig");
    expect(t).toContain("Material bestellt, 20.11.2026 (in 7 Tagen)");
    expect(t).toContain("https://woodflow.example/fristen");
    expect(k!.attachments[0].contentType).toBe("application/vnd.microsoft.card.adaptive");
  });

  it("sendet nichts, wenn nichts fällig ist, und kürzt lange Listen", () => {
    expect(fristenKarte([], heute)).toBeNull();
    const viele = Array.from({ length: 40 }, (_, i) => z(`26.${String(i).padStart(4, "0")}`, "bta", "2026-11-01"));
    expect(inhalt(fristenKarte(faelligeFristen(viele, heute), heute))).toContain("… und 10 weitere");
  });

  it("meldet nur offene Prüfpunkte", () => {
    const punkte = [
      { gruppe: "Listen", pruefung: "Stückliste", status: "OK", hinweis: null },
      { gruppe: "Pläne", pruefung: "Elementpläne", status: "fehlt", hinweis: "Ordner leer" },
    ];
    const t = inhalt(pruefungKarte({ nummer: "26.0138", name: "Tunstetten", bereich: "produktion", status: "WARNUNG", punkte }));
    expect(t).toContain("Ablage Produktion 26.0138 hat offene Punkte");
    expect(t).toContain("1 von 2 Punkten offen");
    expect(t).toContain("Pläne: Elementpläne (FEHLT): Ordner leer");
    expect(t).not.toContain("Stückliste");
    expect(pruefungKarte({ nummer: "26.0138", bereich: "montage", status: "OK", punkte: [punkte[0]] })).toBeNull();
  });

  it("erkennt, ob sich die offenen Punkte seit der letzten Prüfung geändert haben", () => {
    const a = { gruppe: "Pläne", pruefung: "Elementpläne", status: "FEHLT", hinweis: "Ordner leer" };
    const b = { gruppe: "Listen", pruefung: "Stückliste", status: "warnung", hinweis: null };
    const ok = { gruppe: "Listen", pruefung: "Verladeliste", status: "OK", hinweis: null };
    expect(offenSignatur([a, b, ok])).toBe(offenSignatur([ok, { ...b, status: "WARNUNG" }, a]));
    expect(offenSignatur([a, b])).not.toBe(offenSignatur([a]));
    expect(offenSignatur([ok])).toBe("");
    expect(offenSignatur(undefined)).toBe("");
  });

  it("sendet per POST und verrät die Adresse in keinem Fehler", async () => {
    const geheim = "https://geheim.example/workflows/abc?sig=xyz";
    const holen = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    expect(await sendeAnTeams(geheim, { a: 1 }, holen as unknown as typeof fetch)).toEqual({ ok: true });
    expect(holen.mock.calls[0][1].method).toBe("POST");

    const faelle = [
      await sendeAnTeams(geheim, {}, vi.fn().mockResolvedValue({ ok: false, status: 400 }) as unknown as typeof fetch),
      await sendeAnTeams(geheim, {}, vi.fn().mockRejectedValue(new TypeError(`fetch ${geheim} failed`)) as unknown as typeof fetch),
      await sendeAnTeams("http://unsicher.example", {}, holen as unknown as typeof fetch),
      await sendeAnTeams("", {}, holen as unknown as typeof fetch),
    ];
    for (const f of faelle) {
      expect(f.ok).toBe(false);
      expect(JSON.stringify(f)).not.toContain("geheim");
    }
    expect(holen).toHaveBeenCalledTimes(1);
  });

  it("rechnet das heutige Datum in Schweizer Zeit", () => {
    expect(heuteZuerich(new Date("2026-11-13T23:30:00Z"))).toBe("2026-11-14");
  });
});
