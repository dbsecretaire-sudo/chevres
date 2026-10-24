/** Les n° de boucle d'un champ : séparés par des virgules, des points-virgules ou des espaces (vide : aucun). */
export const numerosDeBoucles = (texte: string | undefined): string[] =>
  (texte ?? '').split(/[,;\s]+/).filter(Boolean);

/** Vrai quand le champ des boucles d'un contrôle ou d'une visite nomme cette boucle. */
export const concerneLaBoucle = (champ: string | undefined, numeroBoucle: string | undefined): boolean =>
  !!numeroBoucle && numerosDeBoucles(champ).includes(numeroBoucle);

/** Le nombre de colonnes de la liste des boucles d'une visite. */
export const COLONNES_BOUCLES = 5;

/** Les valeurs réparties en colonnes qui se lisent de haut en bas, puis de gauche à droite (la première colonne est la plus remplie). */
export function repartirEnColonnes<T>(valeurs: T[], colonnes: number = COLONNES_BOUCLES): T[][] {
  const lignes = Math.ceil(valeurs.length / colonnes);
  return Array.from({ length: colonnes }, (_, c) => valeurs.slice(c * lignes, (c + 1) * lignes));
}

