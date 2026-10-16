import type { ValeurDe } from '@/shared/constants/valeurDe';

/** L'agritourisme (volet Commercial) : visites de la ferme, parcours en 4x4, repas, dégustation — à modifier ici uniquement. */

/** Ce qu'une formule peut comprendre. */
export const ELEMENT_AGRITOURISME = {
  VISITE: 'visite',
  QUATRE_QUATRE: 'quatre_quatre',
  REPAS: 'repas',
  DEGUSTATION: 'degustation',
} as const;

export type ElementAgritourisme = ValeurDe<typeof ELEMENT_AGRITOURISME>;

/** L'état d'une visite : à venir, faite (la recette est inscrite en comptabilité) ou annulée. */
export const STATUT_VISITE = {
  PREVUE: 'prevue',
  REALISEE: 'realisee',
  ANNULEE: 'annulee',
} as const;

export type StatutVisite = ValeurDe<typeof STATUT_VISITE>;

/** Les visites dont le nombre compte dans le bilan : tout sauf les annulées. */
export const STATUTS_VISITE_COMPTEES: readonly StatutVisite[] = [
  STATUT_VISITE.PREVUE,
  STATUT_VISITE.REALISEE,
];

/** Le compte de la recette d'une visite réalisée (une recette « autre », rangée dans l'atelier Agritourisme). */
export const COMPTE_AGRITOURISME = { numero: '706200', libelle: 'Prestations — Agritourisme' } as const;

/** Le taux de TVA proposé pour une formule (visites, repas à emporter ou sur place) : indicatif, à confirmer avec votre comptable. */
export const TAUX_TVA_AGRITOURISME = 10;

/** Le nombre de personnes d'une nouvelle visite. */
export const PARTICIPANTS_PAR_DEFAUT = 10;

/** Les vues de l'écran Agritourisme. */
export const VUE_AGRITOURISME = {
  A_VENIR: 'a_venir',
  REALISEES: 'realisees',
  TOUTES: 'toutes',
} as const;

export type VueAgritourisme = ValeurDe<typeof VUE_AGRITOURISME>;
