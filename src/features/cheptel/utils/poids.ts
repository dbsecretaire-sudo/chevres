/** Un poids écrit « 9,5 » ou « 9.5 » en nombre (kg) ; rien pour un champ vide ou qui n'est pas un nombre positif. */
export function lirePoids(texte: string): number | undefined {
  const n = Number(texte.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
