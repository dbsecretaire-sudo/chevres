import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';

/** Une étape du fil d'Ariane (« Atelier > Gestion > Réserver > Nouvelle commande ») : son nom, et la page où elle mène quand on peut y aller. */
export interface Maillon {
  libelle: string;
  route?: string;
}

/** Les routes d'un menu : la sienne, ou celles de ses écrans. */
export const routesDuMenu = (menu: DefinitionMenu): string[] => [
  ...(menu.route ? [menu.route] : []),
  ...(menu.items ?? []).flatMap((e) => ('route' in e ? [e.route] : [])),
];

/** Deux noms qui ne diffèrent que par la casse, les accents, les espaces ou un pluriel (« Stock » et « Stocks ») sont le même. */
const simple = (nom: string) => nom.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/s$/, '');
const memeNom = (a: string, b: string) => simple(a) === simple(b);

/** Ajoute une étape ; si elle porte le même nom que la précédente (l'accueil d'un menu), les deux n'en font qu'une, qui garde la page où mener. */
function ajouter(chemin: Maillon[], maillon: Maillon): void {
  const dernier = chemin[chemin.length - 1];
  if (dernier && memeNom(dernier.libelle, maillon.libelle)) dernier.route ??= maillon.route;
  else chemin.push({ ...maillon });
}

/** Le chemin d'une page dans les menus : le menu, la partie (« Gestion »), la page. Vide si la page n'est dans aucun menu. */
export function cheminDansLesMenus(menus: readonly DefinitionMenu[], route: string | undefined): Maillon[] {
  const menu = route ? menus.find((m) => routesDuMenu(m).includes(route)) : undefined;
  if (!menu || !route) return [];
  const chemin: Maillon[] = [];
  // Le menu mène à son accueil (sa page, ou à défaut sa première page), la partie à sa première page : chaque étape va quelque part.
  const premiere = (menu.items ?? []).find((e): e is { label: string; route: string } => 'route' in e);
  ajouter(chemin, { libelle: menu.label, route: menu.route ?? premiere?.route });
  if (menu.route === route) return chemin;
  let partie: string | undefined;
  let premiereDeLaPartie: string | undefined;
  for (const item of menu.items ?? []) {
    if ('separateur' in item) {
      if (item.titre) {
        partie = item.titre;
        premiereDeLaPartie = undefined;
      }
      continue;
    }
    premiereDeLaPartie ??= item.route;
    if (item.route !== route) continue;
    if (partie) ajouter(chemin, { libelle: partie, route: premiereDeLaPartie });
    ajouter(chemin, { libelle: item.label, route: item.route });
    break;
  }
  return chemin;
}

/**
 * Le fil d'Ariane d'une page : son chemin dans les menus, puis le titre de l'écran quand il est plus précis que la page du menu (« Nouvelle commande » sous « Réserver »).
 * Un écran qu'aucun menu ne porte (un formulaire) se place sous la dernière page de menu vue (`retenue`) : c'est d'où l'on vient. La dernière étape est la page ouverte :
 * elle ne mène nulle part.
 */
export function filDeLaPage(menus: readonly DefinitionMenu[], courante: string | undefined, retenue: string | undefined, titre: string): Maillon[] {
  const chemin = cheminDansLesMenus(menus, courante ?? retenue);
  if (titre) ajouter(chemin, { libelle: titre });
  if (chemin.length > 0) delete chemin[chemin.length - 1].route;
  return chemin;
}

/** La dernière page de menu ouverte : un écran de formulaire, qui n'est dans aucun menu, s'y rattache. Elle se retient d'un écran à l'autre. */
let derniereDuMenu: string | undefined;
export const retenirPageDuMenu = (route: string | undefined): void => {
  if (route) derniereDuMenu = route;
};
export const pageDuMenuRetenue = (): string | undefined => derniereDuMenu;
