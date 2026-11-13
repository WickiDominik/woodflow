// Filterpanel für den 3D-Viewer, angelehnt an cadwork: Listen für BG, BUG und Material
// mit Sichtbarkeit je Wert, "nur diese anzeigen" (Isolieren), Alle / Keine / Umkehren.
import { useMemo, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { filterListe, isoliere, umschalten, type Ausgeblendet, type FilterArt, type FilterEintrag, type TeilAttribute } from "@/lib/ifcFilter";
import { KATEGORIE_REIHENFOLGE, KATEGORIEN, type MaterialKategorie } from "@/lib/ifcMaterial";

const TITEL: Record<FilterArt, string> = { bg: "BG", bug: "BUG", material: "Material" };

function Zeile({
  e,
  aus,
  onUmschalten,
  onIsolieren,
  eingerueckt,
}: {
  e: FilterEintrag;
  aus: boolean;
  onUmschalten: () => void;
  onIsolieren: () => void;
  eingerueckt?: boolean;
}) {
  return (
    <div
      className={cn("group flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted", eingerueckt && "pl-6", aus && "text-muted-foreground")}
      onDoubleClick={onIsolieren}
      title="Doppelklick: nur diese anzeigen"
    >
      <Checkbox checked={!aus} onCheckedChange={onUmschalten} aria-label={`${e.wert} anzeigen`} />
      <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={onUmschalten}>
        {e.kategorie && !eingerueckt && (
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ backgroundColor: KATEGORIEN[e.kategorie].farbe }} />
        )}
        {e.wert}
        {e.zusatz && <span className="ml-1.5 text-xs text-muted-foreground">{e.zusatz}</span>}
      </button>
      <span className="text-xs tabular-nums text-muted-foreground">{e.anzahl}</span>
      <button
        type="button"
        onClick={onIsolieren}
        className="rounded p-0.5 text-muted-foreground opacity-60 hover:bg-background hover:text-foreground group-hover:opacity-100"
        aria-label={`Nur ${e.wert} anzeigen`}
        title="Nur diese anzeigen"
      >
        <Eye size={14} />
      </button>
    </div>
  );
}

export default function IfcFilterPanel({
  attribute,
  ausgeblendet,
  onChange,
}: {
  attribute: TeilAttribute[];
  ausgeblendet: Ausgeblendet;
  onChange: (a: Ausgeblendet) => void;
}) {
  const [art, setArt] = useState<FilterArt>("bg");
  const [suche, setSuche] = useState("");

  const listen = useMemo(
    () => ({ bg: filterListe(attribute, "bg"), bug: filterListe(attribute, "bug"), material: filterListe(attribute, "material") }),
    [attribute],
  );
  const liste = listen[art];
  const alleWerte = useMemo(() => liste.map((e) => e.wert), [liste]);
  const gefiltert = useMemo(() => {
    const s = suche.trim().toLowerCase();
    return s ? liste.filter((e) => e.wert.toLowerCase().includes(s) || e.zusatz?.toLowerCase().includes(s)) : liste;
  }, [liste, suche]);
  const aus = ausgeblendet[art];

  const setze = (werte: Set<string>) => onChange({ ...ausgeblendet, [art]: werte });
  // Bei aktiver Suche wirken Alle/Keine/Umkehren nur auf die gefundenen Einträge.
  const betroffen = gefiltert.map((e) => e.wert);
  const alle = () => setze(new Set([...aus].filter((w) => !betroffen.includes(w))));
  const keine = () => setze(new Set([...aus, ...betroffen]));
  const umkehren = () => setze(new Set(alleWerte.filter((w) => (betroffen.includes(w) ? !aus.has(w) : aus.has(w)))));

  const materialGruppen = useMemo(() => {
    if (art !== "material") return [];
    const m = new Map<MaterialKategorie, FilterEintrag[]>();
    for (const e of gefiltert) {
      const k = e.kategorie ?? "sonstiges";
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return KATEGORIE_REIHENFOLGE.filter((k) => m.has(k)).map((k) => ({ kategorie: k, eintraege: m.get(k)! }));
  }, [art, gefiltert]);

  const zeile = (e: FilterEintrag, eingerueckt?: boolean) => (
    <Zeile
      key={e.wert}
      e={e}
      aus={aus.has(e.wert)}
      eingerueckt={eingerueckt}
      onUmschalten={() => onChange(umschalten(ausgeblendet, art, e.wert))}
      onIsolieren={() => onChange(isoliere(ausgeblendet, art, [e.wert], alleWerte))}
    />
  );

  return (
    <div className="flex h-full flex-col gap-2">
      <Tabs value={art} onValueChange={(v) => setArt(v as FilterArt)}>
        <TabsList className="grid w-full grid-cols-3">
          {(Object.keys(TITEL) as FilterArt[]).map((a) => (
            <TabsTrigger key={a} value={a} className="text-xs">
              {TITEL[a]}
              {ausgeblendet[a].size > 0 && <EyeOff size={12} className="ml-1 text-amber-600" />}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="relative">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={suche} onChange={(e) => setSuche(e.target.value)} placeholder={`${TITEL[art]} suchen …`} className="h-8 pl-7 text-sm" />
      </div>
      <div className="flex gap-1 text-xs">
        {[
          ["Alle", alle],
          ["Keine", keine],
          ["Umkehren", umkehren],
        ].map(([label, fn]) => (
          <button key={label as string} type="button" onClick={fn as () => void} className="flex-1 rounded border px-2 py-1 hover:bg-muted">
            {label as string}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {gefiltert.length === 0 && <p className="p-2 text-sm text-muted-foreground">Keine Einträge.</p>}
        {art !== "material"
          ? gefiltert.map((e) => zeile(e))
          : materialGruppen.map(({ kategorie, eintraege }) => {
              const werte = eintraege.map((e) => e.wert);
              const sichtbar = werte.filter((w) => !aus.has(w)).length;
              const zustand = sichtbar === werte.length ? true : sichtbar === 0 ? false : "indeterminate";
              return (
                <div key={kategorie} className="mb-1">
                  <div className="flex items-center gap-2 px-1.5 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Checkbox
                      checked={zustand}
                      onCheckedChange={() => {
                        const s = new Set(aus);
                        for (const w of werte) {
                          if (zustand === true) s.add(w);
                          else s.delete(w);
                        }
                        setze(s);
                      }}
                      aria-label={`${KATEGORIEN[kategorie].label} anzeigen`}
                    />
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: KATEGORIEN[kategorie].farbe }} />
                    <span className="flex-1 truncate">{KATEGORIEN[kategorie].label}</span>
                    <button
                      type="button"
                      onClick={() => onChange(isoliere(ausgeblendet, "material", werte, alleWerte))}
                      className="rounded p-0.5 hover:bg-muted hover:text-foreground"
                      title="Nur diese Kategorie anzeigen"
                      aria-label={`Nur ${KATEGORIEN[kategorie].label} anzeigen`}
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                  {eintraege.map((e) => zeile(e, true))}
                </div>
              );
            })}
      </div>
    </div>
  );
}
