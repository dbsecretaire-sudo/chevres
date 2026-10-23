/**
 * L'historique des pages vues, pour la flèche de retour du bas : elle ramène à la page d'où l'on vient, quel que soit le chemin pris pour arriver (un bouton de l'accueil,
 * le menu, un onglet). La navigation par onglets garde sa propre pile, qui ne dit pas toujours d'où l'on arrive : on tient donc la nôtre. Sans écran : il se teste seul.
 */

/** Le nombre de pages gardées : au-delà, les plus anciennes s'oublient. */
const PAGES_GARDEES = 60;

let pile: string[] = [];

/** On est sur cette page (adresse et paramètres) : elle s'ajoute, sauf si c'est déjà la dernière. */
export function noterPage(adresse: string): void {
  if (pile[pile.length - 1] === adresse) return;
  pile.push(adresse);
  if (pile.length > PAGES_GARDEES) pile = pile.slice(pile.length - PAGES_GARDEES);
}

/** L'accueil est la racine : tout ce qui a été vu avant est oublié. */
export function repartirDeLAccueil(adresse: string): void {
  pile = [adresse];
}

/** La page d'avant, sans rien changer. */
export function pageDAvant(): string | undefined {
  return pile.length >= 2 ? pile[pile.length - 2] : undefined;
}

/** Recule d'une page : celle qu'on quitte s'oublie, et la page d'avant est rendue. Rien quand il n'y en a pas. */
export function reculer(): string | undefined {
  if (pile.length < 2) return undefined;
  pile.pop();
  return pile[pile.length - 1];
}

/** Tout oublier (pour les tests, ou un changement d'établissement). */
export function viderHistorique(): void {
  pile = [];
}
