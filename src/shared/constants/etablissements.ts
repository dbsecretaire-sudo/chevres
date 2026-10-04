/** Valeurs des types d'établissement — à modifier ici uniquement. */

/** Espèces élevées dans un établissement d'élevage (choix multiple). */
export const TYPE_ANIMAL_ETABLISSEMENT = {
  COCHONS: 'cochons',
  VACHES: 'vaches',
  CHEVRES: 'chevres',
  BREBIS: 'brebis',
  POULES: 'poules',
} as const;

/** Choix du groupe « Société / Auto-entrepreneur » : activités d'un établissement non agricole (choix multiple). */
export const ACTIVITE_SOCIETE = {
  LIBERAL: 'liberal',
  PRESTATIONS_SERVICE: 'prestations_service',
  VENTE: 'vente',
  /** Choisi automatiquement dès qu'un établissement élève des animaux. */
  AGRICOLE: 'agricole',
  /** Case seule, au même niveau que les groupes : usage personnel, exclusive de tout autre choix. */
  PERSO: 'perso',
} as const;

/** Activité d'une écriture comptable qui ne concerne aucune espèce en particulier (carburant, impôts, etc.). */
export const ACTIVITE_COMMUNE = 'commun';
