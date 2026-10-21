import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Valeurs métier de la comptabilité — à modifier ici uniquement. */

export const TYPE_FACTURE = {
  RECUE: 'recue',
  EMISE: 'emise',
} as const;

/**
 * Les volets d'une association ou d'une coopérative agricole (L'Illoc, Casgiu Casanu…) : ce que l'exploitation fait avec elle. Une écriture se range dans un volet ;
 * la vente groupée est une recette, les autres des dépenses.
 */
export const VOLET_COOPERATIVE = {
  ACHAT_GROUPE: 'achat_groupe',
  VENTE_GROUPEE: 'vente_groupee',
  MUTUALISATION: 'mutualisation',
  EXPERTS: 'experts',
  TRANSPORTS: 'transports',
} as const;

/** Ce qu'une facture d'assurance couvre : les bâtiments, les animaux ou un véhicule de la flotte (dont on choisit alors la plaque). */
export const OBJET_ASSURANCE = {
  BATIMENTS: 'batiments',
  ANIMAUX: 'animaux',
  VEHICULE: 'vehicule',
} as const;

/** Catégorie de dépense pour une facture reçue (achat). */
export const CATEGORIE_DEPENSE = {
  ALIMENTATION: 'alimentation',
  CARBURANT: 'carburant',
  REPARATION: 'reparation',
  VETERINAIRE: 'veterinaire',
  /** Ancienne catégorie : la prime d'un véhicule s'enregistre maintenant en « Assurances », avec l'objet « Véhicule » (voir OBJET_ASSURANCE). Les écritures déjà saisies restent lisibles. */
  ASSURANCE_VEHICULE: 'assurance_vehicule',
  /** Les analyses d'un laboratoire (lait, prophylaxie…). */
  ANALYSES_LABORATOIRE: 'analyses_laboratoire',
  PRODUCTION: 'production',
  /** L'achat d'animaux vivants (à un autre éleveur) : chaque animal acheté a sa fiche dans le cheptel, et un document de circulation. */
  ANIMAUX_VIVANTS: 'animaux_vivants',
  /** Des animaux vivants qui partent (à l'abattoir) : une vente de l'inventaire, facturée en dépense. Leur fiche sort du cheptel. */
  ANIMAUX_VIVANTS_VENTE: 'animaux_vivants_vente',
  IMPOTS: 'impots',
  AUTRE: 'autre',
  // --- Entreprise (hors élevage) ---
  ACHATS_MARCHANDISES: 'achats_marchandises',
  FOURNITURES: 'fournitures',
  SOUS_TRAITANCE: 'sous_traitance',
  LOYER_CHARGES: 'loyer_charges',
  ASSURANCES: 'assurances',
  TELECOM: 'telecom',
  DEPLACEMENTS: 'deplacements',
  FRAIS_BANCAIRES: 'frais_bancaires',
  COTISATIONS_SOCIALES: 'cotisations_sociales',
  FORMATION: 'formation',
  HONORAIRES: 'honoraires',
  PUBLICITE: 'publicite',
  MATERIEL: 'materiel',
  /** Remboursement (total ou partiel) d'un client, inscrit depuis un séjour du gîte déjà payé. */
  REMBOURSEMENT_CLIENT: 'remboursement_client',
  // --- Activité financière (journal de trading) ---
  /** Perte nette d'un trade clos, inscrite automatiquement depuis le journal. */
  PERTES_TRADING: 'pertes_trading',
  /** Retrait d'argent du compte de trading. */
  RETRAIT: 'retrait',
} as const;

/** Catégorie de recette pour une facture émise (vente / aide). */
export const CATEGORIE_RECETTE = {
  LAIT: 'lait',
  FROMAGE: 'fromage',
  CABRIS: 'cabris',
  /** Viande : un animal entier (petits, animal sur pied, animal vivant), choisi dans la liste « Animaux » de l'inventaire. */
  VIANDE: 'viande',
  /** Boucherie / charcuterie : un morceau ou un produit (côte, foie, saucisson…), choisi dans la liste « Boucherie et charcuterie ». */
  BOUCHERIE_CHARCUTERIE: 'boucherie_charcuterie',
  ANIMAL_SUR_PIED: 'animal_sur_pied',
  ANIMAL_VIVANT: 'animal_vivant',
  ANIMAL_MORT: 'animal_mort',
  OEUFS: 'oeufs',
  AIDE: 'aide',
  AUTRE: 'autre',
  /** Un versement du groupement sanitaire (GDS) à l'éleveur : un remboursement, une indemnité, une ristourne. Ce n'est ni une vente ni une aide. */
  GROUPEMENT_SANITAIRE: 'groupement_sanitaire',
  /** Un remboursement d'analyses par un laboratoire (ou ce qu'il reverse) : ni une vente ni une aide. */
  REMBOURSEMENT_ANALYSES: 'remboursement_analyses',
  /** Ce que l'assurance d'un véhicule verse (une indemnité après un sinistre, un remboursement de prime) : elle se lie à son véhicule. */
  ASSURANCE_VEHICULE: 'assurance_vehicule',
  // --- Entreprise (hors élevage) ---
  PRESTATIONS: 'prestations',
  VENTE_MARCHANDISES: 'vente_marchandises',
  HEBERGEMENT: 'hebergement',
  RESTAURATION: 'restauration',
  BAR: 'bar',
  COTISATIONS: 'cotisations',
  DONS: 'dons',
  // --- Activité financière (journal de trading) ---
  /** Gain net d'un trade clos, inscrit automatiquement depuis le journal. */
  GAINS_TRADING: 'gains_trading',
  /** Dépôt d'argent sur le compte de trading. */
  DEPOT: 'depot',
} as const;

/** À quelle activité du gîte un achat de marchandises sert : le bar, le restaurant ou une activité annexe. */
export const RUBRIQUE_MARCHANDISE = {
  BAR: 'bar',
  RESTAURANT: 'restaurant',
  ANNEXE: 'annexe',
} as const;

/** Les unités d'une quantité de marchandise achetée. */
export const UNITE_MARCHANDISE = {
  UNITE: 'unite',
  KG: 'kg',
  BAC: 'bac',
  PIECE: 'piece',
  LITRE: 'litre',
} as const;

/** Les unités proposées pour une quantité achetée (« Unité » et « Bac » ne le sont plus, mais d'anciennes saisies les gardent). */
export const UNITES_MARCHANDISE_PROPOSEES = [
  UNITE_MARCHANDISE.KG,
  UNITE_MARCHANDISE.PIECE,
  UNITE_MARCHANDISE.LITRE,
] as const;

/** Les rubriques de la liste de comptabilité d'un gîte : tout, le gîte (hébergement, repas), le bar, ou le reste de l'activité. */
export const RUBRIQUE_COMPTABILITE = {
  TOUT: 'tout',
  GITE: 'gite',
  BAR: 'bar',
  ACTIVITE: 'activite',
} as const;

/** La rubrique de la liste de comptabilité d'une marchandise achetée, selon l'activité qu'elle sert. */
export const RUBRIQUE_COMPTABLE_DE_MARCHANDISE = {
  [RUBRIQUE_MARCHANDISE.BAR]: RUBRIQUE_COMPTABILITE.BAR,
  [RUBRIQUE_MARCHANDISE.RESTAURANT]: RUBRIQUE_COMPTABILITE.GITE,
  [RUBRIQUE_MARCHANDISE.ANNEXE]: RUBRIQUE_COMPTABILITE.ACTIVITE,
} as const;

/** Les catégories de recette qui relèvent du gîte (le reste hors bar est « Activité »). */
export const RECETTES_DU_GITE: readonly string[] = [
  CATEGORIE_RECETTE.HEBERGEMENT,
  CATEGORIE_RECETTE.RESTAURATION,
];

/** Les catégories de dépense qui relèvent du gîte : les remboursements faits aux clients. */
export const DEPENSES_DU_GITE: readonly string[] = [CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT];

/** Catégories de vente de production (saisies comme des ventes, pas comme des factures). */
export const CATEGORIE_VENTE = {
  LAIT: 'lait',
  FROMAGE: 'fromage',
  CABRIS: 'cabris',
  VIANDE: 'viande',
  BOUCHERIE_CHARCUTERIE: 'boucherie_charcuterie',
  ANIMAL_SUR_PIED: 'animal_sur_pied',
  ANIMAL_VIVANT: 'animal_vivant',
  ANIMAL_MORT: 'animal_mort',
  OEUFS: 'oeufs',
} as const;

/** Sépare les identifiants des animaux d'une vente (Vente.animaux). */
export const SEPARATEUR_ANIMAUX = ';';

/** Ventes d'animaux : on saisit un nombre de têtes (et, facultatif, un poids). */
export const CATEGORIES_VENTE_ANIMAUX = [
  CATEGORIE_VENTE.CABRIS,
  CATEGORIE_VENTE.ANIMAL_SUR_PIED,
  CATEGORIE_VENTE.ANIMAL_VIVANT,
  CATEGORIE_VENTE.ANIMAL_MORT,
] as const;

/** Ventes de viande et de charcuterie : un montant, sans quantité. */
export const CATEGORIES_VENTE_VIANDE = [
  CATEGORIE_VENTE.VIANDE,
  CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE,
] as const;

/** Ventes dont le prix total est toujours calculé : le prix défini à l'inventaire × la quantité (jamais saisi). */
export const CATEGORIES_VENTE_PRIX_INVENTAIRE: readonly string[] = [
  CATEGORIE_VENTE.LAIT,
  CATEGORIE_VENTE.FROMAGE,
  CATEGORIE_VENTE.OEUFS,
  CATEGORIE_VENTE.VIANDE,
  CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE,
];

/** Ventes dont le détail (la ligne de l'inventaire vendue) est obligatoire. */
export const CATEGORIES_VENTE_AVEC_DETAIL: readonly string[] = [
  CATEGORIE_VENTE.VIANDE,
  CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE,
];

/** Ventes qui acceptent un commentaire facultatif pour préciser de quoi il s'agissait. */
export const CATEGORIES_VENTE_AVEC_PRECISION = [
  CATEGORIE_VENTE.VIANDE,
  CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE,
  CATEGORIE_VENTE.ANIMAL_SUR_PIED,
  CATEGORIE_VENTE.ANIMAL_VIVANT,
  CATEGORIE_VENTE.ANIMAL_MORT,
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
  MAIS_CONCASSE: 'mais_concasse',
  MAIS_PONTE: 'mais_ponte',
  /** Les croquettes des animaux domestiques (chiens, chats…). */
  CROQUETTES: 'croquettes',
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
  TYPE_ALIMENT.MAIS_CONCASSE,
  TYPE_ALIMENT.MAIS_PONTE,
  TYPE_ALIMENT.AUTRE,
] as const;

/** Aliments proposés selon l'espèce (ceux qu'on ajoute au stock s'y joignent). */
export const TYPES_ALIMENT_PAR_ESPECE: Record<string, readonly ValeurDe<typeof TYPE_ALIMENT>[]> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: [
    TYPE_ALIMENT.MAIS,
    TYPE_ALIMENT.LUZERNE,
    TYPE_ALIMENT.FOIN,
    TYPE_ALIMENT.PAILLE,
  ],
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: [
    TYPE_ALIMENT.MAIS,
    TYPE_ALIMENT.LUZERNE,
    TYPE_ALIMENT.FOIN,
    TYPE_ALIMENT.PAILLE,
  ],
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: [
    TYPE_ALIMENT.FOURRAGE,
    TYPE_ALIMENT.LUZERNE,
    TYPE_ALIMENT.FOIN,
    TYPE_ALIMENT.CEREALES,
    TYPE_ALIMENT.SEL,
  ],
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: [TYPE_ALIMENT.PORC_CROISSANCE],
  [TYPE_ANIMAL_ETABLISSEMENT.POULES]: [TYPE_ALIMENT.MAIS_CONCASSE, TYPE_ALIMENT.MAIS_PONTE],
  [TYPE_ANIMAL_ETABLISSEMENT.DOMESTIQUES]: [TYPE_ALIMENT.CROQUETTES],
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
  CATEGORIE_DEPENSE.ANALYSES_LABORATOIRE,
  CATEGORIE_DEPENSE.PRODUCTION,
  CATEGORIE_DEPENSE.ANIMAUX_VIVANTS,
  CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE,
  CATEGORIE_DEPENSE.IMPOTS,
  CATEGORIE_DEPENSE.AUTRE,
] as const;

/**
 * Premier niveau du choix d'une recette : quelques groupes, pour ne pas avoir une longue liste. Les groupes qui
 * contiennent plusieurs recettes ouvrent une seconde liste (lait ou fromage ; petits, animal sur pied ou vivant…).
 */
export const GROUPE_RECETTE = {
  FROMAGES: 'fromages',
  LAIT: 'lait',
  OEUFS: 'oeufs',
  VIANDE: 'viande',
  BOUCHERIE: 'boucherie',
  AIDE: 'aide',
  AUTRE: 'autre',
  GROUPEMENT_SANITAIRE: 'groupement_sanitaire',
  REMBOURSEMENT_ANALYSES: 'remboursement_analyses',
  ASSURANCE_VEHICULE: 'assurance_vehicule',
  // --- Entreprise : un groupe par recette (pas de seconde liste) ---
  PRESTATIONS: 'prestations',
  VENTE_MARCHANDISES: 'vente_marchandises',
  HEBERGEMENT: 'hebergement',
  RESTAURATION: 'restauration',
  BAR: 'bar',
  COTISATIONS: 'cotisations',
  DONS: 'dons',
  GAINS_TRADING: 'gains_trading',
  DEPOT: 'depot',
} as const;

export interface GroupeRecetteDefinition {
  groupe: ValeurDe<typeof GROUPE_RECETTE>;
  categories: readonly ValeurDe<typeof CATEGORIE_RECETTE>[];
}

const AIDE_ET_AUTRE: GroupeRecetteDefinition[] = [
  { groupe: GROUPE_RECETTE.AIDE, categories: [CATEGORIE_RECETTE.AIDE] },
  { groupe: GROUPE_RECETTE.AUTRE, categories: [CATEGORIE_RECETTE.AUTRE] },
];

/**
 * L'aide, les prestations de services puis l'autre recette : ce que propose un élevage en plus de sa production. Les prestations
 * y sont pour les organismes, qui n'ont que l'aide ou une facture de prestations (voir GROUPES_RECETTE_ORGANISME).
 */
const AIDE_PRESTATIONS_ET_AUTRE: GroupeRecetteDefinition[] = [
  AIDE_ET_AUTRE[0],
  // Un versement du groupement sanitaire (GDS) : remboursement, indemnité, ristourne.
  { groupe: GROUPE_RECETTE.GROUPEMENT_SANITAIRE, categories: [CATEGORIE_RECETTE.GROUPEMENT_SANITAIRE] },
  // Un remboursement d'analyses par un laboratoire.
  { groupe: GROUPE_RECETTE.REMBOURSEMENT_ANALYSES, categories: [CATEGORIE_RECETTE.REMBOURSEMENT_ANALYSES] },
  // Ce que verse l'assurance d'un véhicule.
  { groupe: GROUPE_RECETTE.ASSURANCE_VEHICULE, categories: [CATEGORIE_RECETTE.ASSURANCE_VEHICULE] },
  { groupe: GROUPE_RECETTE.PRESTATIONS, categories: [CATEGORIE_RECETTE.PRESTATIONS] },
  AIDE_ET_AUTRE[1],
];

/** La viande : un animal entier, dont le détail (petits, animal sur pied, animal vivant) se choisit dans la liste « Animaux ». */
const GROUPE_VIANDE: GroupeRecetteDefinition = {
  groupe: GROUPE_RECETTE.VIANDE,
  categories: [CATEGORIE_RECETTE.VIANDE],
};

/** La boucherie / charcuterie : un morceau ou un produit (côte, foie, saucisson…), choisi dans la liste « Boucherie et charcuterie ». */
const GROUPE_BOUCHERIE: GroupeRecetteDefinition = {
  groupe: GROUPE_RECETTE.BOUCHERIE,
  categories: [CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE],
};

/** Chèvres, brebis et vaches : les fromages et le lait, puis la viande. */
const GROUPES_RECETTE_LAITIERS: GroupeRecetteDefinition[] = [
  { groupe: GROUPE_RECETTE.FROMAGES, categories: [CATEGORIE_RECETTE.FROMAGE] },
  { groupe: GROUPE_RECETTE.LAIT, categories: [CATEGORIE_RECETTE.LAIT] },
  GROUPE_VIANDE,
  GROUPE_BOUCHERIE,
  ...AIDE_PRESTATIONS_ET_AUTRE,
];

/** Cochons : pas de laiterie ; la viande, l'aide et le reste. */
const GROUPES_RECETTE_VIANDE: GroupeRecetteDefinition[] = [
  GROUPE_VIANDE,
  GROUPE_BOUCHERIE,
  ...AIDE_PRESTATIONS_ET_AUTRE,
];

/** Poules : les œufs, puis la viande, l'aide et le reste. */
const GROUPES_RECETTE_POULES: GroupeRecetteDefinition[] = [
  { groupe: GROUPE_RECETTE.OEUFS, categories: [CATEGORIE_RECETTE.OEUFS] },
  GROUPE_VIANDE,
  GROUPE_BOUCHERIE,
  ...AIDE_PRESTATIONS_ET_AUTRE,
];

/** Les groupes de recettes (et leurs recettes) proposés selon l'espèce de l'activité. */
export const GROUPES_RECETTE_PAR_ESPECE: Record<string, GroupeRecetteDefinition[]> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: GROUPES_RECETTE_LAITIERS,
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: GROUPES_RECETTE_LAITIERS,
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: GROUPES_RECETTE_LAITIERS,
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: GROUPES_RECETTE_VIANDE,
  [TYPE_ANIMAL_ETABLISSEMENT.POULES]: GROUPES_RECETTE_POULES,
  // Des animaux de compagnie : pas de production à vendre, seulement l'aide et le reste.
  [TYPE_ANIMAL_ETABLISSEMENT.DOMESTIQUES]: AIDE_PRESTATIONS_ET_AUTRE,
};

// --- Entreprise (hors élevage) ---
const unSeulChoix = (
  groupe: ValeurDe<typeof GROUPE_RECETTE>,
  categorie: ValeurDe<typeof CATEGORIE_RECETTE>,
): GroupeRecetteDefinition => ({ groupe, categories: [categorie] });

/** Recettes d'une activité de prestations de service ou libérale. */
export const GROUPES_RECETTE_SERVICES: GroupeRecetteDefinition[] = [
  unSeulChoix(GROUPE_RECETTE.PRESTATIONS, CATEGORIE_RECETTE.PRESTATIONS),
  unSeulChoix(GROUPE_RECETTE.VENTE_MARCHANDISES, CATEGORIE_RECETTE.VENTE_MARCHANDISES),
  ...AIDE_ET_AUTRE,
];

/** Recettes d'une association (gîte, restauration, bar) : hébergement, restauration, bar, cotisations, dons… */
export const GROUPES_RECETTE_ASSOCIATION: GroupeRecetteDefinition[] = [
  unSeulChoix(GROUPE_RECETTE.HEBERGEMENT, CATEGORIE_RECETTE.HEBERGEMENT),
  unSeulChoix(GROUPE_RECETTE.RESTAURATION, CATEGORIE_RECETTE.RESTAURATION),
  unSeulChoix(GROUPE_RECETTE.BAR, CATEGORIE_RECETTE.BAR),
  unSeulChoix(GROUPE_RECETTE.VENTE_MARCHANDISES, CATEGORIE_RECETTE.VENTE_MARCHANDISES),
  unSeulChoix(GROUPE_RECETTE.COTISATIONS, CATEGORIE_RECETTE.COTISATIONS),
  unSeulChoix(GROUPE_RECETTE.DONS, CATEGORIE_RECETTE.DONS),
  ...AIDE_ET_AUTRE,
];

/** Recettes d'une activité financière : les gains du journal de trading et les dépôts sur le compte. */
export const GROUPES_RECETTE_FINANCE: GroupeRecetteDefinition[] = [
  unSeulChoix(GROUPE_RECETTE.GAINS_TRADING, CATEGORIE_RECETTE.GAINS_TRADING),
  unSeulChoix(GROUPE_RECETTE.DEPOT, CATEGORIE_RECETTE.DEPOT),
];

/** Dépenses propres à une activité financière : les pertes du journal de trading et les retraits du compte. */
export const CATEGORIES_DEPENSE_FINANCE = [
  CATEGORIE_DEPENSE.PERTES_TRADING,
  CATEGORIE_DEPENSE.RETRAIT,
] as const;

/**
 * Dépenses d'une entreprise (hors élevage), dans l'ordre d'affichage : les dépenses régulières seulement. Les achats
 * ponctuels (matériel, réparation, formation…) se rangent sous « Autre » ; le remboursement d'un client se crée tout seul.
 */
export const CATEGORIES_DEPENSE_ENTREPRISE = [
  CATEGORIE_DEPENSE.FOURNITURES,
  CATEGORIE_DEPENSE.ACHATS_MARCHANDISES,
  CATEGORIE_DEPENSE.LOYER_CHARGES,
  CATEGORIE_DEPENSE.ASSURANCES,
  CATEGORIE_DEPENSE.TELECOM,
  CATEGORIE_DEPENSE.DEPLACEMENTS,
  CATEGORIE_DEPENSE.FRAIS_BANCAIRES,
  CATEGORIE_DEPENSE.COTISATIONS_SOCIALES,
  CATEGORIE_DEPENSE.HONORAIRES,
  CATEGORIE_DEPENSE.IMPOTS,
  CATEGORIE_DEPENSE.AUTRE,
] as const;

/** Groupes d'une écriture « commune » (qui ne concerne aucune espèce en particulier). */
export const GROUPES_RECETTE_COMMUNS = AIDE_PRESTATIONS_ET_AUTRE;

const aplatir = (groupes: GroupeRecetteDefinition[]) => groupes.flatMap((g) => g.categories);

/** Toutes les recettes proposées selon l'espèce de l'activité. */
export const CATEGORIES_RECETTE_PAR_ESPECE: Record<string, readonly ValeurDe<typeof CATEGORIE_RECETTE>[]> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: aplatir(GROUPES_RECETTE_PAR_ESPECE.chevres),
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: aplatir(GROUPES_RECETTE_PAR_ESPECE.brebis),
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: aplatir(GROUPES_RECETTE_PAR_ESPECE.vaches),
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: aplatir(GROUPES_RECETTE_PAR_ESPECE.cochons),
  [TYPE_ANIMAL_ETABLISSEMENT.POULES]: aplatir(GROUPES_RECETTE_PAR_ESPECE.poules),
  [TYPE_ANIMAL_ETABLISSEMENT.DOMESTIQUES]: aplatir(GROUPES_RECETTE_PAR_ESPECE.domestiques),
};

/** Recettes d'une écriture « commune » (qui ne concerne aucune espèce en particulier). */
export const CATEGORIES_RECETTE_COMMUNES = aplatir(GROUPES_RECETTE_COMMUNS);

export const ORDRE_CATEGORIE_RECETTE = [
  CATEGORIE_RECETTE.LAIT,
  CATEGORIE_RECETTE.FROMAGE,
  CATEGORIE_RECETTE.CABRIS,
  CATEGORIE_RECETTE.VIANDE,
  CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE,
  CATEGORIE_RECETTE.ANIMAL_SUR_PIED,
  CATEGORIE_RECETTE.ANIMAL_VIVANT,
  CATEGORIE_RECETTE.ANIMAL_MORT,
  CATEGORIE_RECETTE.OEUFS,
  CATEGORIE_RECETTE.PRESTATIONS,
  CATEGORIE_RECETTE.VENTE_MARCHANDISES,
  CATEGORIE_RECETTE.HEBERGEMENT,
  CATEGORIE_RECETTE.RESTAURATION,
  CATEGORIE_RECETTE.BAR,
  CATEGORIE_RECETTE.COTISATIONS,
  CATEGORIE_RECETTE.DONS,
  CATEGORIE_RECETTE.GAINS_TRADING,
  CATEGORIE_RECETTE.DEPOT,
  CATEGORIE_RECETTE.AIDE,
  CATEGORIE_RECETTE.GROUPEMENT_SANITAIRE,
  CATEGORIE_RECETTE.REMBOURSEMENT_ANALYSES,
  CATEGORIE_RECETTE.ASSURANCE_VEHICULE,
  CATEGORIE_RECETTE.AUTRE,
] as const;

// --- TVA (taux en %) ---
/** Taux de TVA proposés dans les formulaires (taux normal, intermédiaire, réduits, particulier et taux zéro). */
export const TAUX_TVA_DISPONIBLES = [0, 2.1, 5.5, 10, 13, 20] as const;

/** Les taux d'imposition (part d'une aide incluse dans les recettes imposables) proposés d'office : l'utilisateur modifie la liste. */
export const TAUX_IMPOSITION_PROPOSES = [0, 25, 50, 75, 100] as const;

/** Taux pré-rempli pour une facture d'achat. */
export const TAUX_TVA_ACHAT_DEFAUT = 2.1;

/** Taux pré-rempli pour une facture d'achat de carburant. */
export const TAUX_TVA_CARBURANT = 13;

/** Taux pré-rempli pour une dépense d'entreprise assujettie à la TVA. */
export const TAUX_TVA_ACHAT_ENTREPRISE_DEFAUT = 20;

/** Taux pré-rempli pour une recette d'entreprise assujettie à la TVA, selon sa catégorie (à confirmer avec votre comptable). */
export const TAUX_TVA_RECETTE_ENTREPRISE = {
  [CATEGORIE_RECETTE.PRESTATIONS]: 20,
  [CATEGORIE_RECETTE.VENTE_MARCHANDISES]: 20,
  [CATEGORIE_RECETTE.HEBERGEMENT]: 10,
  [CATEGORIE_RECETTE.RESTAURATION]: 10,
  [CATEGORIE_RECETTE.BAR]: 20,
  [CATEGORIE_RECETTE.GAINS_TRADING]: 0,
  [CATEGORIE_RECETTE.DEPOT]: 0,
  [CATEGORIE_RECETTE.COTISATIONS]: 0,
  [CATEGORIE_RECETTE.DONS]: 0,
  [CATEGORIE_RECETTE.AIDE]: 0,
  [CATEGORIE_RECETTE.GROUPEMENT_SANITAIRE]: 0,
  [CATEGORIE_RECETTE.REMBOURSEMENT_ANALYSES]: 0,
  [CATEGORIE_RECETTE.ASSURANCE_VEHICULE]: 0,
  [CATEGORIE_RECETTE.AUTRE]: 20,
} as const;

/** Taux pré-rempli pour une vente de production, selon sa catégorie (indicatif — à confirmer avec le comptable/CGA). */
export const TAUX_TVA_VENTE_PAR_CATEGORIE = {
  [CATEGORIE_VENTE.LAIT]: 5.5,
  [CATEGORIE_VENTE.FROMAGE]: 5.5,
  [CATEGORIE_VENTE.CABRIS]: 10,
  [CATEGORIE_VENTE.VIANDE]: 10,
  [CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE]: 5.5,
  [CATEGORIE_VENTE.ANIMAL_SUR_PIED]: 10,
  [CATEGORIE_VENTE.ANIMAL_VIVANT]: 10,
  [CATEGORIE_VENTE.ANIMAL_MORT]: 5.5,
  [CATEGORIE_VENTE.OEUFS]: 5.5,
} as const;

// --- Pourcentages ---
export const POURCENTAGE_MIN = 0;
export const POURCENTAGE_MAX = 100;

/** Ce que le client souhaite pour une vente : qu'elle soit déclarée (avec facture), ou non (sans facture). */
export const TYPE_CHOIX_FACTURE = {
  AVEC_FACTURE: 'avec_facture',
  SANS_FACTURE: 'sans_facture',
} as const;
