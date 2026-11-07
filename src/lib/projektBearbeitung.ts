export function darfProjektBearbeiten(rollen: readonly string[]): boolean {
  return rollen.some((rolle) => ["admin", "projektleitung", "avor"].includes(rolle));
}

export function externerProjektLink(wert: string | null): string | null {
  if (!wert?.trim()) return null;
  try {
    const url = new URL(wert.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}