import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';

/** Ce qu'une échéance à venir est : une somme à encaisser (vente ou facture émise), à payer (facture reçue) ou la mensualité d'un emprunt. */
export const TYPE_ECHEANCE = {
  A_ENCAISSER: 'a_encaisser',
  A_PAYER: 'a_payer',
  EMPRUNT: 'emprunt',
} as const;

/** Les écritures qui ne sont pas des mouvements de trésorerie de l'exploitation : le compte de trading (dépôts, retraits, gains, pertes). */
export const CATEGORIES_DEPENSE_HORS_TRESORERIE: readonly string[] = [
  CATEGORIE_DEPENSE.RETRAIT,
  CATEGORIE_DEPENSE.PERTES_TRADING,
];
export const CATEGORIES_RECETTE_HORS_TRESORERIE: readonly string[] = [
  CATEGORIE_RECETTE.DEPOT,
  CATEGORIE_RECETTE.GAINS_TRADING,
];
