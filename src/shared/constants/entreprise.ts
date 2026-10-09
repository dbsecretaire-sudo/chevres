import { CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';
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

/** Les natures de recette que la déclaration URSSAF d'un micro-entrepreneur distingue. */
export const NATURE_URSSAF = {
  VENTE_MARCHANDISES: 'vente_marchandises',
  SERVICES_COMMERCIAUX: 'services_commerciaux',
  SERVICES_LIBERAUX: 'services_liberaux',
} as const;

/**
 * Taux de cotisations sociales (%) d'un micro-entrepreneur pour chaque nature de recette, À TITRE INDICATIF : ces taux changent
 * selon les années et les options — à vérifier sur autoentrepreneur.urssaf.fr. Le taux saisi dans les informations de
 * l'entreprise l'emporte.
 */
export const TAUX_URSSAF_PAR_NATURE = {
  [NATURE_URSSAF.VENTE_MARCHANDISES]: 12.3,
  [NATURE_URSSAF.SERVICES_COMMERCIAUX]: 21.2,
  [NATURE_URSSAF.SERVICES_LIBERAUX]: 25.6,
} as const;

/** La nature d'une prestation de services d'après le régime « micro » de l'entreprise (quand la recette n'en choisit pas). */
export const NATURE_URSSAF_DES_SERVICES_PAR_REGIME = {
  [REGIME_FISCAL.MICRO_BIC_VENTE]: NATURE_URSSAF.SERVICES_COMMERCIAUX,
  [REGIME_FISCAL.MICRO_BIC_SERVICES]: NATURE_URSSAF.SERVICES_COMMERCIAUX,
  [REGIME_FISCAL.MICRO_BNC]: NATURE_URSSAF.SERVICES_LIBERAUX,
} as const;

/** La nature d'une prestation de services quand l'entreprise n'a pas de régime « micro » renseigné. */
export const NATURE_URSSAF_DES_SERVICES_PAR_DEFAUT = NATURE_URSSAF.SERVICES_LIBERAUX;

/** La nature d'office de l'hébergement du gîte (une prestation de services commerciale, les repas et le bar étant des ventes). */
export const NATURE_URSSAF_DE_L_HEBERGEMENT = NATURE_URSSAF.SERVICES_COMMERCIAUX;

/** La nature d'office des ventes d'une activité annexe (pizzas, charcuterie…) ; un service (visite guidée) se choisit dans l'activité. */
export const NATURE_URSSAF_DES_ACTIVITES_ANNEXES = NATURE_URSSAF.VENTE_MARCHANDISES;

/** Un compte qui commence ainsi est une vente de marchandises (707…), quelle que soit la catégorie de la recette. */
export const PREFIXES_COMPTE_VENTE_MARCHANDISES = ['707'] as const;

/** Les catégories de recette d'une entreprise dont la nature (pour l'URSSAF) se choisit sur la recette. */
export const CATEGORIES_RECETTE_AVEC_NATURE_URSSAF = [
  CATEGORIE_RECETTE.PRESTATIONS,
  CATEGORIE_RECETTE.VENTE_MARCHANDISES,
  CATEGORIE_RECETTE.HEBERGEMENT,
  CATEGORIE_RECETTE.RESTAURATION,
  CATEGORIE_RECETTE.BAR,
  CATEGORIE_RECETTE.AUTRE,
] as const;
