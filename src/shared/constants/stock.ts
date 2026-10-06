import { TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Valeurs du stock de la fromagerie (fromages, emballages, matériel, conditionnement) — à modifier ici uniquement. */

type TypeFromage = ValeurDe<typeof TYPE_FROMAGE>;

/** Ce qu'un article de stock est : un fromage, un emballage ou du matériel. */
export const GENRE_ARTICLE = {
  FROMAGE: 'fromage',
  EMBALLAGE: 'emballage',
  /** Le matériel de fromagerie (casserole, présure, sel…) : celui d'office, et celui qu'on y ajoute. */
  MATERIEL: 'materiel',
  /** L'équipement qui se consomme (gants, filtres…) : toujours ajouté par l'utilisateur. */
  EQUIPEMENT: 'equipement',
  /** Le matériel du bâtiment (grillage, poteaux…) : toujours ajouté par l'utilisateur, sans rapport avec la fromagerie. */
  BATIMENT: 'batiment',
  /** Un aliment des animaux (exploitation agricole) : ceux d'office de l'espèce, et ceux qu'on ajoute. */
  ALIMENT: 'aliment',
  /** Un produit d'entretien (toujours ajouté par l'utilisateur). */
  ENTRETIEN: 'entretien',
  /** Un type de viande ou de charcuterie vendu (saucisson, jambon…), toujours ajouté par l'utilisateur. */
  VIANDE: 'viande',
} as const;

/**
 * La nature d'un stock : ce qui se vend (fromages, viande, lait), ce qui se consomme (aliments, emballages, entretien — il
 * s'épuise à l'usage) ou ce qui est un investissement (matériel, équipement — il s'achète et dure).
 */
export const NATURE_STOCK = {
  VENTE: 'vente',
  CONSOMMABLE: 'consommable',
  INVESTISSEMENT: 'investissement',
} as const;

/** La nature de chaque genre d'article. */
export const NATURE_PAR_GENRE: Record<ValeurDe<typeof GENRE_ARTICLE>, ValeurDe<typeof NATURE_STOCK>> = {
  [GENRE_ARTICLE.FROMAGE]: NATURE_STOCK.VENTE,
  [GENRE_ARTICLE.VIANDE]: NATURE_STOCK.VENTE,
  [GENRE_ARTICLE.ALIMENT]: NATURE_STOCK.CONSOMMABLE,
  [GENRE_ARTICLE.EMBALLAGE]: NATURE_STOCK.CONSOMMABLE,
  [GENRE_ARTICLE.ENTRETIEN]: NATURE_STOCK.CONSOMMABLE,
  [GENRE_ARTICLE.EQUIPEMENT]: NATURE_STOCK.CONSOMMABLE,
  [GENRE_ARTICLE.MATERIEL]: NATURE_STOCK.INVESTISSEMENT,
  [GENRE_ARTICLE.BATIMENT]: NATURE_STOCK.INVESTISSEMENT,
};

/** Le choix « Matériel » d'une ligne de facture d'alimentation (un achat de matériel, pas d'aliment), dans la liste des cheptels. */
export const CHOIX_MATERIEL = 'materiel';
/** Le choix « Équipement » (un consommable) de la même liste. */
export const CHOIX_EQUIPEMENT = 'equipement';

/** Le choix « toutes les activités » du filtre du stock (sinon : une espèce de l'exploitation). */
export const FILTRE_STOCK_TOUT = 'tout';

/** Les emballages tenus en stock d'office (on peut en ajouter d'autres, avec le nom qu'on veut). */
export const ARTICLE_EMBALLAGE = {
  PAPIER_ALIMENTAIRE: 'papier_alimentaire',
  POT_500G: 'pot_500g',
  COUVERCLE_500G: 'couvercle_500g',
  POT_1KG: 'pot_1kg',
  COUVERCLE_1KG: 'couvercle_1kg',
  FAISSELLE: 'faisselle',
  PAPIER_CROTTIN: 'papier_crottin',
  ETIQUETTE_CROTTIN: 'etiquette_crottin',
  SAC_PLASTIQUE: 'sac_plastique',
} as const;

/** Le matériel et les consommables de fabrication tenus en stock d'office (on peut en ajouter d'autres). */
export const ARTICLE_MATERIEL = {
  BONBONNE_GAZ: 'bonbonne_gaz',
  CASSEROLE_40L: 'casserole_40l',
  ECUMOIRE: 'ecumoire',
  CHARLOTTE: 'charlotte',
  GANTS: 'gants',
  PRESURE: 'presure',
  SEL: 'sel',
} as const;

type Emballage = ValeurDe<typeof ARTICLE_EMBALLAGE>;

/**
 * Les emballages consommés, par fromage vendu, avec chaque type de fromage tant qu'on n'a pas personnalisé : un fromage
 * frais ou affiné dans du papier alimentaire, un crottin avec son papier et son étiquette, le brocciu dans un pot de
 * 500 g avec son couvercle et une faisselle. Les sacs en plastique, eux, se saisissent à la vente.
 */
export const CONDITIONNEMENT_PAR_DEFAUT: Record<TypeFromage, readonly Emballage[]> = {
  [TYPE_FROMAGE.FRAIS]: [ARTICLE_EMBALLAGE.PAPIER_ALIMENTAIRE],
  [TYPE_FROMAGE.AFFINE]: [ARTICLE_EMBALLAGE.PAPIER_ALIMENTAIRE],
  [TYPE_FROMAGE.CROTTIN]: [ARTICLE_EMBALLAGE.PAPIER_CROTTIN, ARTICLE_EMBALLAGE.ETIQUETTE_CROTTIN],
  [TYPE_FROMAGE.BROCCIU]: [
    ARTICLE_EMBALLAGE.POT_500G,
    ARTICLE_EMBALLAGE.COUVERCLE_500G,
    ARTICLE_EMBALLAGE.FAISSELLE,
  ],
  [TYPE_FROMAGE.AUTRE]: [],
};

/** Début de la valeur du choix d'un fromage ajouté dans le stock (suivi de son identifiant), dans le formulaire de vente. */
export const PREFIXE_FROMAGE_AJOUTE = 'ajoute:';

/** Les trois onglets de l'écran Stock, rangés par nature : ce qui se vend, ce qui se consomme, les investissements. */
export const ONGLET_STOCK = {
  VENTE: 'vente',
  CONSOMMABLES: 'consommables',
  INVESTISSEMENTS: 'investissements',
} as const;

/** Les sections déroulables de chaque onglet. */
export const SECTION_STOCK = {
  FROMAGES: 'fromages',
  LAIT: 'lait',
  VIANDE: 'viande',
  ALIMENTS: 'aliments',
  EMBALLAGES: 'emballages',
  CONDITIONNEMENT: 'conditionnement',
  ENTRETIEN: 'entretien',
  EQUIPEMENT: 'equipement',
  EQUIPEMENT_CONSOMMABLE: 'equipementConsommable',
  MATERIEL: 'materiel',
} as const;

/** D'où vient un mouvement de stock : d'une vente (retiré avec elle) ou d'une saisie à la main. */
export const ORIGINE_MOUVEMENT = {
  VENTE: 'vente',
  MANUEL: 'manuel',
  /** Les petits nés vivants d'une naissance déclarée (ajoutés à la ligne des jeunes de la viande). */
  NAISSANCE: 'naissance',
  /** Les aliments d'une facture d'alimentation reçue (leurs kilos entrent au stock). */
  ACHAT: 'achat',
  /** Ce que les animaux ont mangé ou ce qui a servi (retrait d'un consommable : aliment, emballage, entretien). */
  CONSOMMATION: 'consommation',
} as const;

/** Les lignes de viande tenues d'office pour chaque espèce : ses petits, puis l'animal sur pied et l'animal vivant. */
export const ROLE_VIANDE = {
  JEUNE: 'jeune',
  SUR_PIED: 'pied',
  VIVANT: 'vivant',
} as const;
