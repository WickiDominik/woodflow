/** Projektnummer im Format JJ.NNNN, z. B. 26.0138 */
export const PROJEKTNUMMER_RE = /^\d{2}\.\d{4}$/;
export const istGueltigeProjektnummer = (s: string) => PROJEKTNUMMER_RE.test(s.trim());
