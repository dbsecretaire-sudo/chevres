/** « 12-30 », « 12 – 30 » : deux nombres séparés d'un tiret (une plage de numéros). */
const PLAGE = /^(\d+)\s*[-–]\s*(\d+)$/;

/** Une plage de numéros tapée (du plus petit au plus grand, même tapée à l'envers), ou rien quand le texte n'en est pas une. */
export interface Plage {
  /** Les deux nombres tels qu'ils ont été tapés (pour les afficher). */
  debut: string;
  fin: string;
  min: number;
  max: number;
}

export function lirePlage(texte: string): Plage | null {
  const trouve = PLAGE.exec(texte.trim());
  if (!trouve) return null;
  const [a, b] = [Number(trouve[1]), Number(trouve[2])];
  return { debut: trouve[1], fin: trouve[2], min: Math.min(a, b), max: Math.max(a, b) };
}

/** Les éléments dont le numéro est dans la plage (ceux sans numéro n'y sont jamais). */
export const dansLaPlage = <T>(
  elements: T[],
  plage: Plage,
  numeroDe: (element: T) => number | undefined,
): T[] =>
  elements.filter((e) => {
    const numero = numeroDe(e);
    return numero !== undefined && numero >= plage.min && numero <= plage.max;
  });
