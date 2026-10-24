
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

/** Les natures de recette que la déclaration URSSAF d'un micro-entrepreneur distingue. */
export const NATURE_URSSAF = {
  VENTE_MARCHANDISES: 'vente_marchandises',
  SERVICES_COMMERCIAUX: 'services_commerciaux',
  SERVICES_LIBERAUX: 'services_liberaux',
} as const;
