import { CATEGORIE_RECETTE, TYPE_FROMAGE } from '@/shared/constants/comptabilite';
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
  /** Un article d'une liste que l'utilisateur a créée dans la structure des catégories (voir ListeInventaire). */
  PERSONNALISE: 'perso',
  /** Un type de viande ou de charcuterie vendu (saucisson, jambon…), toujours ajouté par l'utilisateur. */
  VIANDE: 'viande',
  /** Les boucles d'identification (et les boucles rouges) : chacune a son numéro, achetées par plages de numéros. */
  BOUCLE: 'boucle',
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
  // Une liste personnalisée se comporte comme un consommable (retirer, c'est consommer) ; sa vraie nature suit sa catégorie.
  [GENRE_ARTICLE.PERSONNALISE]: NATURE_STOCK.CONSOMMABLE,
  [GENRE_ARTICLE.BOUCLE]: NATURE_STOCK.CONSOMMABLE,
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

/** Les espèces dont les animaux n'ont pas de boucle d'identification : leur numéro ne va pas à l'inventaire des boucles. */
export const ESPECES_SANS_BOUCLE: readonly string[] = ['poules', 'domestiques'];

/** Les deux sortes de boucles tenues d'office dans l'inventaire (on ne peut ni en ajouter ni en retirer). */
export const ARTICLE_BOUCLE = {
  BOUCLES: 'boucles',
  ROUGES: 'rouges',
} as const;

/** Le filtre des boucles de l'inventaire : toutes, celles déjà posées sur un animal, ou celles encore à poser. */
export const ETAT_BOUCLE = {
  TOUT: 'tout',
  POSEE: 'posee',
  NON_POSEE: 'non_posee',
} as const;

/** Le filtre des lots de fromage de l'inventaire : tous, ceux en stock, ceux vendus, ou ceux rappelés. */
export const ETAT_LOT = {
  TOUT: 'tout',
  EN_STOCK: 'en_stock',
  VENDU: 'vendu',
  RAPPELE: 'rappele',
} as const;

/** Les colonnes d'après lesquelles on trie la liste des lots. */
export const TRI_LOT = {
  NUMERO: 'numero',
  FABRICATION: 'fabrication',
  VENTE: 'vente',
} as const;

/** Le nombre de fromages le plus grand qu'une seule fabrication peut contenir (une plage de numéros de lot). */
export const LOTS_MAX_PAR_FABRICATION = 5000;

/** Le choix « toutes les sortes » de la liste des boucles (sinon : l'identifiant d'un article de boucles). */
export const SORTE_BOUCLES_TOUTES = 'tout';

/** Les colonnes d'après lesquelles on trie la liste des boucles. */
export const TRI_BOUCLE = {
  NUMERO: 'numero',
  POSE: 'pose',
  ACHAT: 'achat',
} as const;

/** Le nombre de boucles le plus grand qu'un seul achat peut contenir (une plage de numéros). */
export const BOUCLES_MAX_PAR_ACHAT = 5000;

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
 * 500 g avec son couvercle et une faisselle.
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

/**
 * Les catégories de l'inventaire, rangées comme l'organisation comptable : ce qu'on fabrique et vend (produits finis), les
 * animaux de l'élevage (vendus vivants ou sur pied), ce qui entre dans la fabrication (matières premières : les aliments),
 * les consommables (autres approvisionnements : emballages, entretien…), ce qu'on achète pour le revendre (marchandises : le
 * bar du gîte) et le matériel durable (immobilisations).
 */
export const CATEGORIE_INVENTAIRE = {
  PRODUITS_FINIS: 'produits_finis',
  PRODUITS_ANIMAUX: 'produits_animaux',
  MATIERES_PREMIERES: 'matieres_premieres',
  AUTRES_APPROVISIONNEMENTS: 'autres_approvisionnements',
  MARCHANDISES: 'marchandises',
  IMMOBILISATIONS: 'immobilisations',
} as const;

/** La catégorie de l'inventaire de chaque genre d'article (les lignes d'animaux de la viande sont rangées à part). */
export const CATEGORIE_PAR_GENRE: Record<
  ValeurDe<typeof GENRE_ARTICLE>,
  ValeurDe<typeof CATEGORIE_INVENTAIRE>
> = {
  [GENRE_ARTICLE.FROMAGE]: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
  [GENRE_ARTICLE.VIANDE]: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
  [GENRE_ARTICLE.ALIMENT]: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES,
  [GENRE_ARTICLE.EMBALLAGE]: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
  [GENRE_ARTICLE.ENTRETIEN]: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
  [GENRE_ARTICLE.EQUIPEMENT]: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
  [GENRE_ARTICLE.MATERIEL]: CATEGORIE_INVENTAIRE.IMMOBILISATIONS,
  [GENRE_ARTICLE.BATIMENT]: CATEGORIE_INVENTAIRE.IMMOBILISATIONS,
  // La catégorie d'un article personnalisé est celle de sa liste (voir ListeInventaire) : celle-ci n'est qu'un repli.
  [GENRE_ARTICLE.PERSONNALISE]: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
  [GENRE_ARTICLE.BOUCLE]: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES,
};

/** La classe du plan comptable de chaque catégorie (35. Produits finis, 33. Produits animaux, 31. Matières premières…). */
export const CLASSE_INVENTAIRE: Record<ValeurDe<typeof CATEGORIE_INVENTAIRE>, string> = {
  [CATEGORIE_INVENTAIRE.PRODUITS_FINIS]: '35',
  [CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX]: '33',
  [CATEGORIE_INVENTAIRE.MATIERES_PREMIERES]: '31',
  [CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS]: '32',
  [CATEGORIE_INVENTAIRE.MARCHANDISES]: '37',
  [CATEGORIE_INVENTAIRE.IMMOBILISATIONS]: '21',
};

/** Le nombre de chiffres d'un compte du plan comptable proposé à une liste. */
export const CHIFFRES_COMPTE_PCG = 6;

/** Début de l'identifiant d'une catégorie ajoutée par l'utilisateur (suivi de son identifiant) : « perso:abc123 ». */
export const PREFIXE_CATEGORIE_PERSO = 'perso:';

/** Un compte commençant par ce chiffre est une immobilisation (classe 2) : ses mouvements sont des investissements. */
export const CHIFFRE_COMPTE_IMMOBILISATION = '2';

/** Le nombre de chiffres du numéro de classe d'une catégorie ajoutée (31, 35, 37…). */
export const CHIFFRES_CLASSE_CATEGORIE = 2;

/** Le nombre minimum de chiffres du début des comptes qu'une catégorie ajoutée autorise (21, 701…) ; le maximum est celui d'un compte. */
export const CHIFFRES_MIN_PREFIXE_COMPTE = 2;

/**
 * Les comptes qu'une liste d'une catégorie peut avoir : ceux de 6 chiffres qui commencent par l'un de ces nombres. Les produits
 * finis et les produits animaux sont des ventes (701…), les matières premières des achats stockés (601…), les autres
 * approvisionnements des achats stockés ou non (602…, 606…), les marchandises des achats ou ventes de marchandises, et les
 * immobilisations des comptes de la classe 21.
 */
export const PREFIXES_COMPTE_PAR_CATEGORIE: Record<
  ValeurDe<typeof CATEGORIE_INVENTAIRE>,
  readonly string[]
> = {
  [CATEGORIE_INVENTAIRE.PRODUITS_FINIS]: ['701', '702', '703'],
  [CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX]: ['701', '702', '703'],
  [CATEGORIE_INVENTAIRE.MATIERES_PREMIERES]: ['601'],
  [CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS]: ['602', '606'],
  [CATEGORIE_INVENTAIRE.MARCHANDISES]: ['607', '707'],
  [CATEGORIE_INVENTAIRE.IMMOBILISATIONS]: ['21'],
};

/** Les sections déroulables de chaque catégorie. */
export const SECTION_STOCK = {
  FROMAGES: 'fromages',
  LAIT: 'lait',
  /** Les œufs des poules : un prix de vente, sans suivi de quantité. */
  OEUFS: 'oeufs',
  VIANDE: 'viande',
  /** Les petits, l'animal sur pied et l'animal vivant : ils suivent le cheptel. */
  ANIMAUX: 'animaux',
  ALIMENTS: 'aliments',
  EMBALLAGES: 'emballages',
  /** Les boucles d'identification, avec le numéro de chacune. */
  BOUCLES: 'boucles',
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
  /** Des fromages rappelés (retirés de la vente) : ils sortent du stock. */
  RAPPEL: 'rappel',
} as const;

/** Les lignes de viande tenues d'office pour chaque espèce : ses petits, puis l'animal sur pied et l'animal vivant. */
export const ROLE_VIANDE = {
  JEUNE: 'jeune',
  SUR_PIED: 'pied',
  VIVANT: 'vivant',
} as const;

/** L'identifiant sous lequel le prix de vente du lait (€ le litre) est gardé dans l'inventaire, comme celui d'un fromage. */
export const CLE_PRIX_LAIT = 'lait';

/** L'identifiant sous lequel le prix de vente de l'œuf (€ pièce) est gardé dans l'inventaire. */
export const CLE_PRIX_OEUFS = 'oeufs';

/** Le prix d'un œuf tant qu'on n'en a pas défini un autre dans l'inventaire (€). */
export const PRIX_OEUF_DEFAUT = 0.5;

/**
 * La section de l'inventaire qui tient chaque catégorie de recette (le prix de vente, la quantité) : le libellé « Catégorie de
 * recette » d'une nouvelle écriture y mène. Une catégorie absente d'ici (aide, autre recette) n'a pas de section.
 */
export const SECTION_STOCK_PAR_CATEGORIE_RECETTE: Record<string, string> = {
  [CATEGORIE_RECETTE.LAIT]: SECTION_STOCK.LAIT,
  [CATEGORIE_RECETTE.FROMAGE]: SECTION_STOCK.FROMAGES,
  [CATEGORIE_RECETTE.OEUFS]: SECTION_STOCK.OEUFS,
  [CATEGORIE_RECETTE.VIANDE]: SECTION_STOCK.VIANDE,
  [CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE]: SECTION_STOCK.VIANDE,
  [CATEGORIE_RECETTE.CABRIS]: SECTION_STOCK.ANIMAUX,
  [CATEGORIE_RECETTE.ANIMAL_SUR_PIED]: SECTION_STOCK.ANIMAUX,
  [CATEGORIE_RECETTE.ANIMAL_VIVANT]: SECTION_STOCK.ANIMAUX,
  [CATEGORIE_RECETTE.ANIMAL_MORT]: SECTION_STOCK.ANIMAUX,
};
