import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';

/**
 * Le régime de TVA suivi dans le pilotage : la franchise en base (aucune TVA), le remboursement forfaitaire agricole (RFA, pour un
 * agriculteur qui ne déclare pas la TVA), le réel simplifié agricole ou d'entreprise (déclaration annuelle, CA12) et le réel normal
 * (déclaration mensuelle ou trimestrielle, CA3).
 */
export const REGIME_TVA_PILOTAGE = {
  FRANCHISE: 'franchise',
  RFA: 'rfa',
  REEL_SIMPLIFIE: 'reel_simplifie',
  REEL_NORMAL: 'reel_normal',
} as const;

/** Le régime proposé tant qu'aucun n'est choisi : celui d'une exploitation qui déclare sa TVA, comme avant ce réglage. */
export const REGIME_TVA_PILOTAGE_PAR_DEFAUT = REGIME_TVA_PILOTAGE.REEL_SIMPLIFIE;

/** Le découpage de l'année dans le pilotage : par mois, par trimestre ou l'année entière. */
export const PERIODICITE_TVA = {
  MENSUELLE: 'mensuelle',
  TRIMESTRIELLE: 'trimestrielle',
  ANNUELLE: 'annuelle',
} as const;

export const PERIODICITE_TVA_PAR_DEFAUT = PERIODICITE_TVA.MENSUELLE;

/** Le nombre de mois que couvre une période, selon la périodicité. */
export const MOIS_PAR_PERIODE = {
  [PERIODICITE_TVA.MENSUELLE]: 1,
  [PERIODICITE_TVA.TRIMESTRIELLE]: 3,
  [PERIODICITE_TVA.ANNUELLE]: 12,
} as const;

/** Les achats qui n'ont normalement pas de TVA (impôts, cotisations, frais bancaires, assurances, remboursements, retraits) : pas d'alerte « sans TVA ». */
export const CATEGORIES_DEPENSE_SANS_TVA: readonly string[] = [
  CATEGORIE_DEPENSE.IMPOTS,
  CATEGORIE_DEPENSE.COTISATIONS_SOCIALES,
  CATEGORIE_DEPENSE.FRAIS_BANCAIRES,
  CATEGORIE_DEPENSE.ASSURANCES,
  CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT,
  CATEGORIE_DEPENSE.RETRAIT,
  CATEGORIE_DEPENSE.PERTES_TRADING,
];

/** Les anomalies que le pilotage repère. */
export const TYPE_CONTROLE_TVA = {
  /** Une vente à déclarer sans taux de TVA. */
  VENTE_SANS_TAUX: 'vente_sans_taux',
  /** Une vente dont le taux n'est pas celui d'usage de sa catégorie (5,5 % le lait, 10 % les petits…). */
  VENTE_TAUX_INHABITUEL: 'vente_taux_inhabituel',
  /** Une facture émise sans taux de TVA. */
  RECETTE_SANS_TAUX: 'recette_sans_taux',
  /** Une facture reçue sans TVA (taux absent ou nul) : la TVA n'est pas récupérée. */
  ACHAT_SANS_TVA: 'achat_sans_tva',
} as const;
