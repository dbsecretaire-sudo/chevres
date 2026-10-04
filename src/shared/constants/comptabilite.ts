import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Valeurs métier de la comptabilité — à modifier ici uniquement. */

export const TYPE_FACTURE = {
  RECUE: 'recue',
  EMISE: 'emise',
} as const;

/** Catégorie de dépense pour une facture reçue (achat). */
export const CATEGORIE_DEPENSE = {
  ALIMENTATION: 'alimentation',
  CARBURANT: 'carburant',
  REPARATION: 'reparation',
  VETERINAIRE: 'veterinaire',
  PRODUCTION: 'production',
  IMPOTS: 'impots',
  AUTRE: 'autre',
} as const;

/** Catégorie de recette pour une facture émise (vente / aide). */
export const CATEGORIE_RECETTE = {
  LAIT: 'lait',
  FROMAGE: 'fromage',
  CABRIS: 'cabris',
  /** Boucherie / charcuterie : le seul choix de viande, pour toutes les espèces. */
  BOUCHERIE_CHARCUTERIE: 'boucherie_charcuterie',
  ANIMAL_SUR_PIED: 'animal_sur_pied',
  ANIMAL_VIVANT: 'animal_vivant',
  AIDE: 'aide',
  AUTRE: 'autre',
} as const;

/** Catégories de vente de production (saisies comme des ventes, pas comme des factures). */
export const CATEGORIE_VENTE = {
  LAIT: 'lait',
  FROMAGE: 'fromage',
  CABRIS: 'cabris',
  BOUCHERIE_CHARCUTERIE: 'boucherie_charcuterie',
  ANIMAL_SUR_PIED: 'animal_sur_pied',
  ANIMAL_VIVANT: 'animal_vivant',
} as const;

/** Ventes d'animaux : on saisit un nombre de têtes (et, facultatif, un poids). */
export const CATEGORIES_VENTE_ANIMAUX = [
  CATEGORIE_VENTE.CABRIS,
  CATEGORIE_VENTE.ANIMAL_SUR_PIED,
  CATEGORIE_VENTE.ANIMAL_VIVANT,
] as const;

/** Ventes de viande et de charcuterie : un montant, sans quantité. */
export const CATEGORIES_VENTE_VIANDE = [CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE] as const;

/** Ventes qui acceptent un commentaire facultatif pour préciser de quoi il s'agissait. */
export const CATEGORIES_VENTE_AVEC_PRECISION = [
  CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE,
  CATEGORIE_VENTE.ANIMAL_SUR_PIED,
  CATEGORIE_VENTE.ANIMAL_VIVANT,
] as const;

export const TYPE_AIDE = {
  PAIEMENT_BASE: 'paiement_base',
  PAIEMENT_REDISTRIBUTIF: 'paiement_redistributif',
  ECOREGIME: 'ecoregime',
  PETITS_RUMINANTS: 'petits_ruminants',
  ICHN: 'ichn',
  AUTRE: 'autre',
} as const;

export const TYPE_ALIMENT = {
  MAIS: 'mais',
  LUZERNE: 'luzerne',
  FOIN: 'foin',
  PAILLE: 'paille',
  FOURRAGE: 'fourrage',
  /** Orge, blé et/ou maïs. */
  CEREALES: 'cereales',
  SEL: 'sel',
  PORC_CROISSANCE: 'porc_croissance',
  AUTRE: 'autre',
} as const;

export const TYPE_CARBURANT = {
  GAZOIL: 'gazoil',
  ESSENCE: 'essence',
  GNR: 'gnr',
  AUTRE: 'autre',
} as const;

export const UNITE_CONDITIONNEMENT = {
  MATELAS: 'matelas',
  BOTTE: 'botte',
  BALLOT: 'ballot',
} as const;

export const TYPE_FROMAGE = {
  FRAIS: 'frais',
  AFFINE: 'affine',
  CROTTIN: 'crottin',
  BROCCIU: 'brocciu',
  AUTRE: 'autre',
} as const;

export const UNITE_VENTE = {
  LITRES: 'litres',
  PIECE: 'piece',
  KG: 'kg',
} as const;

export const SENS_TRANSACTION = {
  ENTREE: 'entree',
  SORTIE: 'sortie',
} as const;

export const SOURCE_TRANSACTION = {
  VENTE: 'vente',
  FACTURE: 'facture',
} as const;

// --- Listes ordonnées (affichage, boucles) ---
/** Tous les types d'aliment, toutes espèces confondues. */
export const TYPES_ALIMENT = [
  TYPE_ALIMENT.MAIS,
  TYPE_ALIMENT.LUZERNE,
  TYPE_ALIMENT.FOIN,
  TYPE_ALIMENT.PAILLE,
  TYPE_ALIMENT.FOURRAGE,
  TYPE_ALIMENT.CEREALES,
  TYPE_ALIMENT.SEL,
  TYPE_ALIMENT.PORC_CROISSANCE,
  TYPE_ALIMENT.AUTRE,
] as const;

/** Aliments proposés selon l'espèce (« Autre » toujours en dernier). */
export const TYPES_ALIMENT_PAR_ESPECE = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: [
    TYPE_ALIMENT.MAIS,
    TYPE_ALIMENT.LUZERNE,
    TYPE_ALIMENT.FOIN,
    TYPE_ALIMENT.PAILLE,
    TYPE_ALIMENT.AUTRE,
  ],
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: [
    TYPE_ALIMENT.MAIS,
    TYPE_ALIMENT.LUZERNE,
    TYPE_ALIMENT.FOIN,
    TYPE_ALIMENT.PAILLE,
    TYPE_ALIMENT.AUTRE,
  ],
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: [
    TYPE_ALIMENT.FOURRAGE,
    TYPE_ALIMENT.LUZERNE,
    TYPE_ALIMENT.FOIN,
    TYPE_ALIMENT.CEREALES,
    TYPE_ALIMENT.SEL,
    TYPE_ALIMENT.AUTRE,
  ],
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: [TYPE_ALIMENT.PORC_CROISSANCE, TYPE_ALIMENT.AUTRE],
} as const;

/** « Autre » est exclu des totaux/moyennes : la précision libre peut recouvrir un achat pour un tout autre élevage que les chèvres. */
export const TYPES_ALIMENT_COMPTABILISES = TYPES_ALIMENT.filter((t) => t !== TYPE_ALIMENT.AUTRE);

export const TYPES_CARBURANT = [
  TYPE_CARBURANT.GAZOIL,
  TYPE_CARBURANT.ESSENCE,
  TYPE_CARBURANT.GNR,
  TYPE_CARBURANT.AUTRE,
] as const;

export const ORDRE_CATEGORIE_DEPENSE = [
  CATEGORIE_DEPENSE.ALIMENTATION,
  CATEGORIE_DEPENSE.CARBURANT,
  CATEGORIE_DEPENSE.REPARATION,
  CATEGORIE_DEPENSE.VETERINAIRE,
  CATEGORIE_DEPENSE.PRODUCTION,
  CATEGORIE_DEPENSE.IMPOTS,
  CATEGORIE_DEPENSE.AUTRE,
] as const;

/**
 * Premier niveau du choix d'une recette : quelques groupes, pour ne pas avoir une longue liste. Les groupes qui
 * contiennent plusieurs recettes ouvrent une seconde liste (lait ou fromage ; petits, animal sur pied ou vivant…).
 */
export const GROUPE_RECETTE = {
  LAITERIE: 'laiterie',
  BOUCHERIE: 'boucherie',
  ANIMAL: 'animal',
  AIDE: 'aide',
  AUTRE: 'autre',
} as const;

export interface GroupeRecetteDefinition {
  groupe: ValeurDe<typeof GROUPE_RECETTE>;
  categories: readonly ValeurDe<typeof CATEGORIE_RECETTE>[];
}

const AIDE_ET_AUTRE: GroupeRecetteDefinition[] = [
  { groupe: GROUPE_RECETTE.AIDE, categories: [CATEGORIE_RECETTE.AIDE] },
  { groupe: GROUPE_RECETTE.AUTRE, categories: [CATEGORIE_RECETTE.AUTRE] },
];

/** Chèvres et brebis : laiterie / fromagerie, puis tout ce qui touche à l'animal (dont la boucherie). */
const GROUPES_RECETTE_LAITIERS: GroupeRecetteDefinition[] = [
  { groupe: GROUPE_RECETTE.LAITERIE, categories: [CATEGORIE_RECETTE.LAIT, CATEGORIE_RECETTE.FROMAGE] },
  {
    groupe: GROUPE_RECETTE.ANIMAL,
    categories: [
      CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE,
      CATEGORIE_RECETTE.CABRIS,
      CATEGORIE_RECETTE.ANIMAL_SUR_PIED,
      CATEGORIE_RECETTE.ANIMAL_VIVANT,
    ],
  },
  ...AIDE_ET_AUTRE,
];

/** Vaches et cochons : pas de laiterie ; la boucherie / charcuterie est un choix à part, puis « animal ». */
const GROUPES_RECETTE_VIANDE: GroupeRecetteDefinition[] = [
  { groupe: GROUPE_RECETTE.BOUCHERIE, categories: [CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE] },
  {
    groupe: GROUPE_RECETTE.ANIMAL,
    categories: [
      CATEGORIE_RECETTE.CABRIS,
      CATEGORIE_RECETTE.ANIMAL_SUR_PIED,
      CATEGORIE_RECETTE.ANIMAL_VIVANT,
    ],
  },
  ...AIDE_ET_AUTRE,
];

/** Les groupes de recettes (et leurs recettes) proposés selon l'espèce de l'activité. */
export const GROUPES_RECETTE_PAR_ESPECE: Record<
  ValeurDe<typeof TYPE_ANIMAL_ETABLISSEMENT>,
  GroupeRecetteDefinition[]
> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: GROUPES_RECETTE_LAITIERS,
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: GROUPES_RECETTE_LAITIERS,
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: GROUPES_RECETTE_VIANDE,
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: GROUPES_RECETTE_VIANDE,
};

/** Groupes d'une écriture « commune » (qui ne concerne aucune espèce en particulier). */
export const GROUPES_RECETTE_COMMUNS = AIDE_ET_AUTRE;

const aplatir = (groupes: GroupeRecetteDefinition[]) => groupes.flatMap((g) => g.categories);

/** Toutes les recettes proposées selon l'espèce de l'activité. */
export const CATEGORIES_RECETTE_PAR_ESPECE: Record<
  ValeurDe<typeof TYPE_ANIMAL_ETABLISSEMENT>,
  readonly ValeurDe<typeof CATEGORIE_RECETTE>[]
> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: aplatir(GROUPES_RECETTE_PAR_ESPECE.chevres),
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: aplatir(GROUPES_RECETTE_PAR_ESPECE.brebis),
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: aplatir(GROUPES_RECETTE_PAR_ESPECE.vaches),
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: aplatir(GROUPES_RECETTE_PAR_ESPECE.cochons),
};

/** Recettes d'une écriture « commune » (qui ne concerne aucune espèce en particulier). */
export const CATEGORIES_RECETTE_COMMUNES = aplatir(GROUPES_RECETTE_COMMUNS);

export const ORDRE_CATEGORIE_RECETTE = [
  CATEGORIE_RECETTE.LAIT,
  CATEGORIE_RECETTE.FROMAGE,
  CATEGORIE_RECETTE.CABRIS,
  CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE,
  CATEGORIE_RECETTE.ANIMAL_SUR_PIED,
  CATEGORIE_RECETTE.ANIMAL_VIVANT,
  CATEGORIE_RECETTE.AIDE,
  CATEGORIE_RECETTE.AUTRE,
] as const;

// --- TVA (taux en %) ---
/** Taux de TVA proposés dans les formulaires (taux normal, intermédiaire, réduits, particulier et taux zéro). */
export const TAUX_TVA_DISPONIBLES = [0, 2.1, 5.5, 10, 13, 20] as const;

/** Taux pré-rempli pour une facture d'achat. */
export const TAUX_TVA_ACHAT_DEFAUT = 2.1;

/** Taux pré-rempli pour une facture d'achat de carburant. */
export const TAUX_TVA_CARBURANT = 13;

/** Taux pré-rempli pour une vente de production, selon sa catégorie (indicatif — à confirmer avec le comptable/CGA). */
export const TAUX_TVA_VENTE_PAR_CATEGORIE = {
  [CATEGORIE_VENTE.LAIT]: 5.5,
  [CATEGORIE_VENTE.FROMAGE]: 5.5,
  [CATEGORIE_VENTE.CABRIS]: 10,
  [CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE]: 5.5,
  [CATEGORIE_VENTE.ANIMAL_SUR_PIED]: 10,
  [CATEGORIE_VENTE.ANIMAL_VIVANT]: 10,
} as const;

// --- Pourcentages ---
export const POURCENTAGE_MIN = 0;
export const POURCENTAGE_MAX = 100;
