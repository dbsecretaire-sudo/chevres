/** Valeurs des types d'établissement — à modifier ici uniquement. */

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

/** Choix du groupe « Société / Auto-entrepreneur » : activités d'un établissement non agricole (choix multiple). */
export const ACTIVITE_SOCIETE = {
  LIBERAL: 'liberal',
  PRESTATIONS_SERVICE: 'prestations_service',
  ASSOCIATION: 'association',
  /** Choisi automatiquement dès qu'un établissement élève des animaux. */
  AGRICOLE: 'agricole',
  /** Case seule, au même niveau que les groupes : usage personnel, exclusive de tout autre choix. */
  PERSO: 'perso',
} as const;

/** Les activités qui font d'un établissement sans animaux une entreprise (et non un élevage). */
export const ACTIVITES_ENTREPRISE: readonly string[] = [
  ACTIVITE_SOCIETE.LIBERAL,
  ACTIVITE_SOCIETE.PRESTATIONS_SERVICE,
  ACTIVITE_SOCIETE.ASSOCIATION,
];

/** Activité d'une écriture comptable qui ne concerne aucune espèce en particulier (carburant, impôts, etc.). */
export const ACTIVITE_COMMUNE = 'commun';

/** Le logo (nom d'icône Ionicons) de chaque activité d'un établissement. */
export const ICONE_ACTIVITE_SOCIETE = {
  [ACTIVITE_SOCIETE.AGRICOLE]: 'paw',
  [ACTIVITE_SOCIETE.ASSOCIATION]: 'bed',
  [ACTIVITE_SOCIETE.PRESTATIONS_SERVICE]: 'folder-open',
  [ACTIVITE_SOCIETE.LIBERAL]: 'stats-chart',
  [ACTIVITE_SOCIETE.PERSO]: 'person',
} as const;

/** Le logo d'un établissement sans activité renseignée. */
export const ICONE_ETABLISSEMENT_PAR_DEFAUT = 'business';
