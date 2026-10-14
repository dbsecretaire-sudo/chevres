/** Le plan d'économies de la rentabilité : ce qui se négocie, ce qui ne se compresse pas, et les hypothèses de départ — à modifier ici uniquement. */

import { CATEGORIE_DEPENSE, TYPE_ALIMENT } from '@/shared/constants/comptabilite';

/**
 * Les hypothèses de départ du plan : ce ne sont pas des données de l'exploitation, mais des points de départ à discuter (une mise en
 * concurrence, un achat groupé). Elles ne promettent rien : le plan montre l'effet de chacune sur le coût du litre.
 */
export const HYPOTHESES_ECONOMIE = {
  /** La part d'un poste négociable (assurance, carburant, entretien…) qu'une mise en concurrence peut faire gagner. */
  negociable: 0.1,
  /** La part du poste alimentation qu'un ajustement du concentré fait gagner quand l'urée du lait est haute (excès d'azote). */
  alimentUreeHaute: 0.05,
} as const;

/** Les investissements que le plan examine : un silo à grain, une cuve à gazole. */
export const INVESTISSEMENT = {
  SILO: 'silo',
  CUVE: 'cuve',
} as const;

/**
 * Ce que chaque investissement fait gagner, en part des postes qu'il touche : des hypothèses de départ (achat en vrac plutôt qu'en sacs,
 * moins de trajets pour livrer, carburant acheté par volume), à vérifier sur devis. Le temps gagné n'est pas chiffré.
 */
export const HYPOTHESES_INVESTISSEMENT = {
  /** Silo à grain : les grains achetés en vrac coûtent moins cher qu'en sacs (part des grains), et les livraisons groupées font moins de trajets (part du carburant). */
  [INVESTISSEMENT.SILO]: { alimentation: 0.05, carburant: 0.05 },
  /** Cuve à gazole : le carburant acheté par volume coûte moins cher qu'à la pompe. */
  [INVESTISSEMENT.CUVE]: { carburant: 0.05 },
} as const;

/** Les aliments qui se stockent en silo (des grains) : le silo ne touche ni le foin, ni la paille, ni la luzerne en balles. */
export const ALIMENTS_EN_SILO: readonly string[] = [
  TYPE_ALIMENT.MAIS,
  TYPE_ALIMENT.CEREALES,
  TYPE_ALIMENT.MAIS_CONCASSE,
  TYPE_ALIMENT.MAIS_PONTE,
  TYPE_ALIMENT.PORC_CROISSANCE,
];

/** Les catégories de dépense qui se négocient (assureur, fournisseur de carburant, achats groupés). */
export const CATEGORIES_NEGOCIABLES: readonly string[] = [
  CATEGORIE_DEPENSE.CARBURANT,
  CATEGORIE_DEPENSE.REPARATION,
  CATEGORIE_DEPENSE.PRODUCTION,
  CATEGORIE_DEPENSE.MATERIEL,
  CATEGORIE_DEPENSE.ASSURANCES,
  CATEGORIE_DEPENSE.TELECOM,
  CATEGORIE_DEPENSE.PUBLICITE,
  CATEGORIE_DEPENSE.DEPLACEMENTS,
  CATEGORIE_DEPENSE.FOURNITURES,
  CATEGORIE_DEPENSE.FRAIS_BANCAIRES,
];

/** Les catégories de dépense qui ne se compriment pas : ce qui est dû (impôts, cotisations). */
export const CATEGORIES_INCOMPRESSIBLES: readonly string[] = [
  CATEGORIE_DEPENSE.IMPOTS,
  CATEGORIE_DEPENSE.COTISATIONS_SOCIALES,
];

/**
 * Les postes « Autre » se reconnaissent à leur nom (celui du compte du plan comptable) : un nom qui contient l'un de ces mots est
 * négociable (« Assurance — Multirisques », « Frais postaux et télécommunications »)…
 */
export const MOTS_POSTE_NEGOCIABLE: readonly string[] = [
  'assurance',
  'postaux',
  'télécom',
  'publicité',
  'déplacement',
  'voyage',
  'fournitures',
  'entretien',
  'bancaire',
];

/** … et un nom qui contient l'un de ceux-ci est dû, donc incompressible (« Cotisations MSA »). */
export const MOTS_POSTE_INCOMPRESSIBLE: readonly string[] = ['cotisation', 'impôt', 'taxe', 'intérêt', 'msa'];

/** De combien le coût alimentaire du litre doit avoir monté (en rapport) d'une année à l'autre pour être signalé. */
export const HAUSSE_COUT_ALIMENT_SIGNALEE = 1.1;

/** De combien le lait par traite doit avoir monté (en rapport) pour que la hausse du coût alimentaire se justifie par la production. */
export const HAUSSE_LAIT_PAR_TRAITE_JUSTIFIEE = 1.05;

/** Un centime d'euro : l'exemple d'une hausse du prix du litre de lait. */
export const UN_CENTIME = 0.01;
