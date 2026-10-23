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
