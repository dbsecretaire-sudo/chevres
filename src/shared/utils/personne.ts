/** Compare deux noms dans l'ordre alphabétique français : sans tenir compte des majuscules ni des accents, les nombres dans l'ordre (2 avant 10). */
export const comparerAlphabetique = (a: string, b: string): number =>
  a.trim().localeCompare(b.trim(), 'fr', { sensitivity: 'base', numeric: true });

/** « Nom Prénom » (le prénom est facultatif). */
export function nomComplet(personne: { nom: string; prenom?: string }): string {
  return `${personne.nom}${personne.prenom ? ` ${personne.prenom}` : ''}`;
}
