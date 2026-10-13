/** Les n° de boucle d'un champ : séparés par des virgules, des points-virgules ou des espaces (vide : aucun). */
export const numerosDeBoucles = (texte: string | undefined): string[] =>
  (texte ?? '').split(/[,;\s]+/).filter(Boolean);

/** Vrai quand le champ des boucles d'un contrôle ou d'une visite nomme cette boucle. */
export const concerneLaBoucle = (champ: string | undefined, numeroBoucle: string | undefined): boolean =>
  !!numeroBoucle && numerosDeBoucles(champ).includes(numeroBoucle);
