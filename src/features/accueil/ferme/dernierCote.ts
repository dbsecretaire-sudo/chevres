/** Le côté de la ferme montré sur l'accueil : l'exploitation (le troupeau) ou le travail du produit (la fromagerie). */
export type CoteDeLAccueil = 'exploitation' | 'transformation';

let dernier: CoteDeLAccueil = 'exploitation';

/** Le dernier côté vu : l'accueil s'ouvre dessus (l'exploitation la première fois). */
export const lireDernierCote = (): CoteDeLAccueil => dernier;

export function noterDernierCote(cote: CoteDeLAccueil): void {
  dernier = cote;
}
