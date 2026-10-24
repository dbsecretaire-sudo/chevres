/**
 * L'historique des pages vues, pour la flèche de retour du bas : elle ramène à la page d'où l'on vient, quel que soit le chemin pris pour arriver (un bouton de l'accueil,
 * le menu, un onglet). La navigation par onglets garde sa propre pile, qui ne dit pas toujours d'où l'on arrive : on tient donc la nôtre. Sans écran : il se teste seul.
 */

/** Le nombre de pages gardées : au-delà, les plus anciennes s'oublient. */
const PAGES_GARDEES = 60;

let pile: string[] = [];

/**
 * On est sur cette page (adresse et paramètres) : elle s'ajoute, sauf si c'est déjà la dernière. Une page déjà vue plus haut (on y revient par la flèche, le fil d'Ariane ou la fin d'un
 * formulaire) n'est pas ajoutée une seconde fois : l'historique revient à elle, et ce qui a été ouvert depuis s'oublie.
 */
export function noterPage(adresse: string): void {
  if (pile[pile.length - 1] === adresse) return;
  const dejaVue = pile.lastIndexOf(adresse);
  if (dejaVue >= 0) {
    pile = pile.slice(0, dejaVue + 1);
    return;
  }
  pile.push(adresse);
  if (pile.length > PAGES_GARDEES) pile = pile.slice(pile.length - PAGES_GARDEES);
}

/** L'accueil est la racine : tout ce qui a été vu avant est oublié. */
export function repartirDeLAccueil(adresse: string): void {
  pile = [adresse];
}

/** Une page de création (« nouvelle écriture », « nouveau contact », « contrat ») : le dernier élément de son adresse commence par « nouvel », « nouveau » ou « ajout », ou vaut « contrat ». */
export const estUneCreation = (page: string): boolean => {
  const dernier = page.split('?')[0].split('/').pop() ?? '';
  return /^(nouvel|nouveau|ajout)/.test(dernier) || dernier === 'contrat';
};

/**
 * La page d'où a commencé la création en cours : la dernière page vue avant la première page de création, même quand la création a plusieurs écrans (une écriture, puis la création
 * de son intervenant). Terminer l'écriture y ramène — la facture créée depuis Assurance revient dans Assurance, pas sur un « Nouvelle écriture » de plus.
 */
export function pageAvantLaCreation(): string | undefined {
  let i = pile.length - 2;
  while (i >= 0 && estUneCreation(pile[i])) i--;
  return i >= 0 ? pile[i] : undefined;
}

/** L'historique revient à cette page (déjà vue) : ce qui a été ouvert depuis s'oublie. Rien ne change si elle n'y est pas. */
export function revenirA(adresse: string): void {
  const rang = pile.lastIndexOf(adresse);
  if (rang >= 0) pile = pile.slice(0, rang + 1);
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
