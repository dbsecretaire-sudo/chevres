/**
 * Le format du fichier de sauvegarde. Une exploitation à un seul établissement garde l'ancien format (un seul jeu de données, à la racine) : il reste lisible partout.
 * Plusieurs établissements : un seul fichier « complet », avec le jeu de données de chacun.
 */

/** Ce qui identifie un établissement dans une sauvegarde complète (de quoi le recréer s'il n'existe plus). */
export interface EntreeDeSauvegardeComplete<S> {
  id: string;
  nom: string;
  animaux?: string[];
  activites?: string[];
  sauvegarde: S;
}

export interface SauvegardeComplete<S> {
  version: number;
  exporteLe: string;
  etablissements: EntreeDeSauvegardeComplete<S>[];
}

/** Un fichier lu est-il une sauvegarde complète (tous les établissements) ? */
export function estSauvegardeComplete(valeur: unknown): valeur is SauvegardeComplete<unknown> {
  if (!valeur || typeof valeur !== 'object') return false;
  const liste = (valeur as { etablissements?: unknown }).etablissements;
  return (
    Array.isArray(liste) &&
    liste.length > 0 &&
    liste.every((e) => !!e && typeof e === 'object' && typeof (e as { nom?: unknown }).nom === 'string' && !!(e as { sauvegarde?: unknown }).sauvegarde)
  );
}

/**
 * L'établissement local qui reçoit une entrée de la sauvegarde : celui de même identifiant, à défaut celui de même nom (une réinstallation donne de nouveaux
 * identifiants). Rien quand aucun ne correspond : il faut le créer.
 */
export function etablissementDeLEntree<E extends { id: string; nom: string }>(
  locaux: readonly E[],
  entree: Pick<EntreeDeSauvegardeComplete<unknown>, 'id' | 'nom'>,
): E | undefined {
  return (
    locaux.find((e) => e.id === entree.id) ??
    locaux.find((e) => e.nom.trim().toLowerCase() === entree.nom.trim().toLowerCase())
  );
}

/** Additionne les compteurs de plusieurs restaurations (un par établissement). */
export function sommeDesCompteurs<C extends object>(compteurs: readonly C[], vide: C): C {
  const somme = { ...vide } as Record<string, unknown>;
  for (const c of compteurs) {
    for (const [cle, valeur] of Object.entries(c)) {
      if (typeof valeur === 'number') somme[cle] = ((somme[cle] as number) ?? 0) + valeur;
    }
  }
  return somme as C;
}
