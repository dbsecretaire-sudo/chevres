/** Un poids écrit « 9,5 » ou « 9.5 » en nombre (kg) ; rien pour un champ vide ou qui n'est pas un nombre positif. */
export function lirePoids(texte: string): number | undefined {
  const n = Number(texte.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Le poids total de ces animaux (kg, à deux décimales) quand chacun a son poids ; rien dès qu'il en manque un (un total partiel
 * serait faux) ou sans animal.
 */
export function poidsTotal(animaux: { poidsKg?: number }[]): number | undefined {
  if (animaux.length === 0 || animaux.some((a) => a.poidsKg === undefined)) return undefined;
  return Math.round(animaux.reduce((t, a) => t + (a.poidsKg as number), 0) * 100) / 100;
}
