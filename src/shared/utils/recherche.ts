/** Un texte sans accents ni majuscules, pour comparer ce qu'on tape à ce qu'on cherche (« etat » trouve « État »). */
export const sansAccents = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Vrai quand le texte contient la recherche (sans tenir compte des accents ni des majuscules) ; une recherche vide garde tout. */
export const contientTexte = (texte: string, recherche: string): boolean =>
  !recherche.trim() || sansAccents(texte).includes(sansAccents(recherche));
