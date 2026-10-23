/** Les paramètres de la page ouverte (« ?lieu=animaux »). */
export type ParametresDePage = Record<string, string | string[] | undefined>;

/**
 * La route est-elle la page ouverte ? Même adresse, et les paramètres de la route (« ?lieu=animaux ») se retrouvent dans ceux de la page : plusieurs entrées d'un menu
 * ouvrent la même page avec un paramètre différent (les lieux de l'exploitation), une seule doit s'allumer.
 */
export function estLaPageOuverte(route: string, adresse: string, parametres: ParametresDePage): boolean {
  const [chemin, requete = ''] = route.split('?');
  if (chemin !== adresse) return false;
  return [...new URLSearchParams(requete)].every(([cle, valeur]) => String(parametres[cle] ?? '') === valeur);
}

/**
 * Parmi les routes d'un menu, celle qui est la page ouverte : si plusieurs lui correspondent (« / » et « /?interieur=transformation » pour l'accueil de l'atelier), la plus
 * précise l'emporte — celle qui demande le plus de paramètres. Rien quand aucune ne correspond.
 */
export function routeLaPlusPrecise(routes: readonly string[], adresse: string, parametres: ParametresDePage): string | undefined {
  const nombreDeParametres = (route: string) => [...new URLSearchParams(route.split('?')[1] ?? '')].length;
  return routes
    .filter((r) => estLaPageOuverte(r, adresse, parametres))
    .sort((a, b) => nombreDeParametres(b) - nombreDeParametres(a))[0];
}
