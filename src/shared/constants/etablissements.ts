/** Valeurs des établissements — à modifier ici uniquement. */

/** Espèces élevées dans un établissement d'élevage (choix multiple). */
export const TYPE_ANIMAL_ETABLISSEMENT = {
  COCHONS: 'cochons',
  VACHES: 'vaches',
  CHEVRES: 'chevres',
  BREBIS: 'brebis',
  POULES: 'poules',
  /** Chiens, chats… : des animaux de compagnie, sans production. */
  DOMESTIQUES: 'domestiques',
} as const;

/** Activité d'une écriture comptable qui ne concerne aucune espèce en particulier (carburant, impôts, etc.). */
export const ACTIVITE_COMMUNE = 'commun';

/** Le logo (nom d'icône Ionicons) d'une exploitation : la patte. */
export const ICONE_ETABLISSEMENT = 'paw';
