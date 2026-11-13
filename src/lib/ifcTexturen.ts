// Prozedurale Materialtexturen (Canvas) für den 3D-Viewer: keine Bilddateien nötig, einmal erzeugt und wiederverwendet.
import * as THREE from "three";
import { KATEGORIEN, type MaterialKategorie } from "@/lib/ifcMaterial";

const GROESSE = 256;

/** Einfacher, reproduzierbarer Zufallsgenerator (gleiche Textur bei jedem Laden). */
function zufall(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const hsl = (c: THREE.Color, dl: number) => {
  const h = { h: 0, s: 0, l: 0 };
  c.getHSL(h);
  return `hsl(${h.h * 360} ${h.s * 100}% ${Math.max(0, Math.min(100, (h.l + dl) * 100))}%)`;
};

/** Holzmaserung: Jahrringe entlang u (Längsrichtung), leicht gewellt, mit vereinzelten Ästen. */
function maserung(ctx: CanvasRenderingContext2D, basis: string, staerke: number, aeste: number, seed: number) {
  const r = zufall(seed);
  const c = new THREE.Color(basis);
  ctx.fillStyle = basis;
  ctx.fillRect(0, 0, GROESSE, GROESSE);
  const linien = 26;
  for (let i = 0; i < linien; i++) {
    const y0 = (i / linien) * GROESSE + r() * 6;
    const amp = 2 + r() * 5;
    const freq = (1 + Math.floor(r() * 3)) * ((Math.PI * 2) / GROESSE);
    const phase = r() * Math.PI * 2;
    ctx.strokeStyle = hsl(c, -(0.06 + r() * 0.1) * staerke);
    ctx.lineWidth = 0.6 + r() * 2.2;
    ctx.globalAlpha = 0.35 + r() * 0.45;
    // Zweimal versetzt zeichnen, damit die Kachel nahtlos ist
    for (const dy of [0, GROESSE, -GROESSE]) {
      ctx.beginPath();
      for (let x = 0; x <= GROESSE; x += 4) {
        const y = y0 + dy + Math.sin(x * freq + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < aeste; i++) {
    const x = r() * GROESSE;
    const y = r() * GROESSE;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 6 + r() * 6);
    g.addColorStop(0, hsl(c, -0.3));
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** OSB: zufällig verteilte, längliche Späne in unterschiedlichen Holztönen. */
function osb(ctx: CanvasRenderingContext2D, basis: string) {
  const r = zufall(7);
  const c = new THREE.Color(basis);
  ctx.fillStyle = hsl(c, -0.08);
  ctx.fillRect(0, 0, GROESSE, GROESSE);
  for (let i = 0; i < 520; i++) {
    const x = r() * GROESSE;
    const y = r() * GROESSE;
    const w = 14 + r() * 26;
    const h = 4 + r() * 6;
    const winkel = (r() - 0.5) * 0.9;
    ctx.fillStyle = hsl(c, (r() - 0.45) * 0.22);
    for (const dx of [0, GROESSE, -GROESSE])
      for (const dy of [0, GROESSE, -GROESSE]) {
        ctx.save();
        ctx.translate(x + dx, y + dy);
        ctx.rotate(winkel);
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }
  }
}

/** Faserige Struktur (Dämmung, Holzfaser): viele kurze, feine Striche. */
function fasern(ctx: CanvasRenderingContext2D, basis: string, anzahl: number, laenge: number, kontrast: number, seed: number) {
  const r = zufall(seed);
  const c = new THREE.Color(basis);
  ctx.fillStyle = basis;
  ctx.fillRect(0, 0, GROESSE, GROESSE);
  ctx.lineWidth = 1;
  for (let i = 0; i < anzahl; i++) {
    const x = r() * GROESSE;
    const y = r() * GROESSE;
    const a = r() * Math.PI;
    const l = laenge * (0.4 + r());
    ctx.strokeStyle = hsl(c, (r() - 0.5) * kontrast);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Feines Rauschen (Gips, Beton, Metall). */
function rauschen(ctx: CanvasRenderingContext2D, basis: string, kontrast: number, poren: number, seed: number) {
  const r = zufall(seed);
  const c = new THREE.Color(basis);
  const bild = ctx.createImageData(GROESSE, GROESSE);
  for (let i = 0; i < GROESSE * GROESSE; i++) {
    const d = (r() - 0.5) * kontrast;
    bild.data[i * 4] = Math.max(0, Math.min(255, (c.r + d) * 255));
    bild.data[i * 4 + 1] = Math.max(0, Math.min(255, (c.g + d) * 255));
    bild.data[i * 4 + 2] = Math.max(0, Math.min(255, (c.b + d) * 255));
    bild.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(bild, 0, 0);
  for (let i = 0; i < poren; i++) {
    ctx.fillStyle = hsl(c, -0.15 - r() * 0.1);
    ctx.beginPath();
    ctx.arc(r() * GROESSE, r() * GROESSE, 0.5 + r() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Gebürstetes Metall: feine Längsstriche. */
function gebuerstet(ctx: CanvasRenderingContext2D, basis: string) {
  rauschen(ctx, basis, 0.04, 0, 3);
  const r = zufall(5);
  const c = new THREE.Color(basis);
  for (let i = 0; i < 160; i++) {
    ctx.strokeStyle = hsl(c, (r() - 0.5) * 0.12);
    ctx.globalAlpha = 0.4;
    const y = r() * GROESSE;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GROESSE, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function zeichne(kat: MaterialKategorie, ctx: CanvasRenderingContext2D) {
  const basis = KATEGORIEN[kat].farbe;
  switch (kat) {
    case "holz":
      return maserung(ctx, basis, 1, 2, 11);
    case "platte":
      return maserung(ctx, basis, 0.6, 0, 23);
    case "osb":
      return osb(ctx, basis);
    case "holzfaser":
      return fasern(ctx, basis, 5000, 5, 0.18, 31);
    case "mineralwolle":
      return fasern(ctx, basis, 6000, 9, 0.25, 41);
    case "daemmung":
      return fasern(ctx, basis, 3500, 7, 0.15, 43);
    case "gips":
      return rauschen(ctx, basis, 0.04, 30, 51);
    case "beton":
      return rauschen(ctx, basis, 0.12, 400, 61);
    case "metall":
      return gebuerstet(ctx, basis);
    default:
      return rauschen(ctx, basis, 0.03, 0, 71);
  }
}

const cache = new Map<MaterialKategorie, THREE.Texture>();

/** Kachelbare Textur je Materialkategorie (UV in Metern → `repeat` = 1 / Kachelgrösse). */
export function textur(kat: MaterialKategorie): THREE.Texture | null {
  const vorhanden = cache.get(kat);
  if (vorhanden) return vorhanden;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = GROESSE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  zeichne(kat, ctx);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const k = 1 / KATEGORIEN[kat].kachel;
  t.repeat.set(k, k);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(kat, t);
  return t;
}
