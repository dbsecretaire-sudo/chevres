/** Valeurs et listes propres à une entreprise (hors élevage) — à modifier ici uniquement. */

/** Forme juridique de l'entreprise ou de l'association. */
export const STATUT_JURIDIQUE = {
  MICRO_ENTREPRISE: 'micro_entreprise',
  ENTREPRISE_INDIVIDUELLE: 'entreprise_individuelle',
  EURL: 'eurl',
  SASU: 'sasu',
  SARL: 'sarl',
  SAS: 'sas',
  ASSOCIATION: 'association',
  AUTRE: 'autre',
} as const;

/** Régime d'imposition des bénéfices. */
export const REGIME_FISCAL = {
  MICRO_BNC: 'micro_bnc',
  MICRO_BIC_SERVICES: 'micro_bic_services',
  MICRO_BIC_VENTE: 'micro_bic_vente',
  DECLARATION_CONTROLEE: 'declaration_controlee',
  REEL_SIMPLIFIE: 'reel_simplifie',
  REEL_NORMAL: 'reel_normal',
  IMPOT_SOCIETES: 'impot_societes',
  NON_FISCALISE: 'non_fiscalise',
} as const;

/** Régime de TVA d'une entreprise assujettie (sans TVA : la case « Assujetti à la TVA » est décochée). */
export const REGIME_TVA = {
  REEL_SIMPLIFIE: 'reel_simplifie',
  REEL_NORMAL: 'reel_normal',
} as const;

/** Régime de TVA proposé quand on coche « Assujetti à la TVA » (modifiable). */
export const REGIME_TVA_PAR_DEFAUT = REGIME_TVA.REEL_SIMPLIFIE;

/**
 * Plafond annuel de chiffre d'affaires (€) et abattement forfaitaire (%) des régimes « micro », À TITRE INDICATIF :
 * ces valeurs changent selon les années fiscales — à vérifier sur impots.gouv.fr ou auprès de votre comptable.
 */
export const PARAMETRES_REGIME_MICRO = {
  [REGIME_FISCAL.MICRO_BNC]: { plafond: 77700, abattement: 34 },
  [REGIME_FISCAL.MICRO_BIC_SERVICES]: { plafond: 77700, abattement: 50 },
  [REGIME_FISCAL.MICRO_BIC_VENTE]: { plafond: 188700, abattement: 71 },
} as const;
