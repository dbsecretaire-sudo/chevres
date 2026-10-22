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

/** Les démarches pour accueillir du public à la ferme (un établissement recevant du public) : leur suivi se fait dans Agritourisme › Accueil du public. */
export const ETAPE_ACCUEIL = {
  /** L'information du maire : une ferme qui reçoit du public est un établissement recevant du public (ERP), de 5e catégorie en général. */
  ERP: 'erp',
  /** La sécurité incendie : extincteurs, issues de secours, consignes ; le SDIS et la mairie disent si une commission de sécurité doit passer. */
  SECURITE_INCENDIE: 'securite_incendie',
  /** L'accessibilité aux personnes handicapées (ou la dérogation) et le registre public d'accessibilité. */
  ACCESSIBILITE: 'accessibilite',
  /** L'assurance responsabilité civile qui couvre l'accueil du public et le contact avec les animaux. */
  ASSURANCE: 'assurance',
  /** L'hygiène et la santé animale auprès de la DDPP : zoonoses, dégustation ou repas. */
  DDPP: 'ddpp',
  /** Les consignes aux visiteurs, la trousse de premiers secours et les numéros d'urgence. */
  CONSIGNES: 'consignes',
  /** Le registre de sécurité où se notent les contrôles. */
  REGISTRE_SECURITE: 'registre_securite',
  /** Les conventions avec les écoles et les groupes. */
  CONVENTION_GROUPES: 'convention_groupes',
} as const;

/** Les démarches sans lesquelles on ne devrait pas recevoir de public : tant que l'une manque (et que la ferme organise des visites), un rappel s'affiche. */
export const ETAPES_ACCUEIL_OBLIGATOIRES: readonly string[] = [
  ETAPE_ACCUEIL.ERP,
  ETAPE_ACCUEIL.SECURITE_INCENDIE,
  ETAPE_ACCUEIL.ACCESSIBILITE,
  ETAPE_ACCUEIL.ASSURANCE,
  ETAPE_ACCUEIL.DDPP,
];

/** Les vues de l'écran Agritourisme. */
export const VUE_AGRITOURISME = {
  A_VENIR: 'a_venir',
  REALISEES: 'realisees',
  TOUTES: 'toutes',
} as const;

export type VueAgritourisme = ValeurDe<typeof VUE_AGRITOURISME>;
