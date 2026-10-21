/** Les côtés de la ferme, dans l'ordre de la bascule du bas (et du balayage) : l'exploitation, l'atelier (le travail du produit), l'agritourisme. */
export const COTES_DE_LA_FERME = ['exploitation', 'transformation', 'agritourisme'] as const;

/** Le côté de la ferme montré sur l'accueil : l'exploitation (le troupeau), l'atelier (le travail du produit) ou l'agritourisme (les visiteurs). */
export type CoteDeLAccueil = (typeof COTES_DE_LA_FERME)[number];

let dernier: CoteDeLAccueil = 'exploitation';

/** Le dernier côté vu : l'accueil s'ouvre dessus (l'exploitation la première fois). */
export const lireDernierCote = (): CoteDeLAccueil => dernier;

export function noterDernierCote(cote: CoteDeLAccueil): void {
  dernier = cote;
}

/** Vrai pour le nom d'un côté (l'adresse de retour en donne un). */
export const estUnCote = (valeur: string | undefined): valeur is CoteDeLAccueil =>
  (COTES_DE_LA_FERME as readonly string[]).includes(valeur ?? '');

/** Le côté voisin dans l'ordre de la bascule (le suivant : +1, le précédent : -1) ; au bout, on reste où l'on est. */
export function coteVoisin(cote: CoteDeLAccueil, sens: 1 | -1): CoteDeLAccueil {
  const i = COTES_DE_LA_FERME.indexOf(cote) + sens;
  return COTES_DE_LA_FERME[Math.min(COTES_DE_LA_FERME.length - 1, Math.max(0, i))];
}
