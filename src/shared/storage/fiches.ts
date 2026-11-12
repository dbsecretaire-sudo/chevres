/**
 * Les fiches synchronisées : une valeur stockée se découpe en fiches. Une liste d'éléments ayant chacun un `id` donne une fiche par élément
 * (zone = la clé de stockage, identifiant = l'id) ; toute autre valeur (un réglage, un objet) forme une seule fiche d'identifiant « _ ».
 * Une fiche supprimée s'envoie avec un contenu vide (null). Ce module ne touche ni au stockage ni au réseau : il calcule seulement ce qui a changé.
 */

/** La fiche d'identifiant « _ » : la valeur entière d'une clé qui n'est pas une liste de fiches. */
export const FICHE_ENTIERE = '_';

/** Une modification à envoyer, ou reçue : une fiche qui a changé (contenu) ou qui a été supprimée (contenu null). */
export interface Modification {
  zone: string;
  identifiant: string;
  contenu: unknown | null;
  /** Vrai : la saisie a été faite en mode normal, par un modérateur ou un administrateur ; elle attend la validation au lieu d'entrer tout de suite. */
  enAttente?: boolean;
}

const estUneFiche = (element: unknown): element is { id: string } =>
  !!element && typeof element === 'object' && typeof (element as { id?: unknown }).id === 'string';

/** Les fiches d'une valeur, par identifiant. */
export function fichesDe(valeur: unknown): Map<string, unknown> {
  const fiches = new Map<string, unknown>();
  if (Array.isArray(valeur) && valeur.every(estUneFiche)) {
    for (const element of valeur) fiches.set(element.id, element);
  } else if (valeur !== undefined) {
    fiches.set(FICHE_ENTIERE, valeur);
  }
  return fiches;
}

/** Ce qui a changé entre la valeur d'avant et celle d'après, fiche par fiche : les ajouts, les modifications et les suppressions. */
export function modificationsDe(zone: string, avant: unknown, apres: unknown): Modification[] {
  const anciennes = fichesDe(avant);
  const nouvelles = fichesDe(apres);
  const modifications: Modification[] = [];
  for (const [identifiant, contenu] of nouvelles) {
    if (!anciennes.has(identifiant) || JSON.stringify(anciennes.get(identifiant)) !== JSON.stringify(contenu)) {
      modifications.push({ zone, identifiant, contenu });
    }
  }
  for (const identifiant of anciennes.keys()) {
    if (!nouvelles.has(identifiant)) modifications.push({ zone, identifiant, contenu: null });
  }
  return modifications;
}

/** Une seule modification par fiche : la plus récente l'emporte. Sert à garder la file d'attente courte. */
export function fusionnerModifications(file: Modification[]): Modification[] {
  const parFiche = new Map<string, Modification>();
  for (const modification of file) parFiche.set(`${modification.zone}\u0000${modification.identifiant}`, modification);
  return [...parFiche.values()];
}

/**
 * Applique une modification à la valeur locale de sa zone, et rend la nouvelle valeur (undefined si la zone n'a plus rien).
 * Pour une fiche entière, la modification remplace la valeur ; pour une fiche d'une liste, elle remplace ou ajoute l'élément, ou le retire.
 */
export function appliquerModification(valeurLocale: unknown, modification: Modification): unknown {
  if (modification.identifiant === FICHE_ENTIERE) {
    return modification.contenu === null ? undefined : modification.contenu;
  }
  const liste: unknown[] = Array.isArray(valeurLocale) ? [...valeurLocale] : [];
  const position = liste.findIndex((element) => estUneFiche(element) && element.id === modification.identifiant);
  if (modification.contenu === null) {
    if (position >= 0) liste.splice(position, 1);
  } else if (position >= 0) {
    liste[position] = modification.contenu;
  } else {
    liste.push(modification.contenu);
  }
  return liste;
}
