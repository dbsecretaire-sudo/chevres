/** « Nom Prénom » (le prénom est facultatif). */
export function nomComplet(personne: { nom: string; prenom?: string }): string {
  return `${personne.nom}${personne.prenom ? ` ${personne.prenom}` : ''}`;
}
