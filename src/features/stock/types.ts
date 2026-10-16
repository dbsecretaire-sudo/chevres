import type { GENRE_ARTICLE, ORIGINE_MOUVEMENT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';

export type GenreArticle = ValeurDe<typeof GENRE_ARTICLE>;

/** Un mouvement du stock : une quantité ajoutée (positive) ou retirée (négative) d'un article, à une date. */
export interface MouvementStock {
  id: string;
  /** L'article touché : « fromage:frais », « emballage:sac_plastique »… (voir cleArticle). */
  article: string;
  date: string;
  delta: number;
  origine: ValeurDe<typeof ORIGINE_MOUVEMENT>;
  /** La vente qui a créé ce mouvement : il suit ses modifications et disparaît avec elle. */
  venteId?: string;
  /** La facture d'alimentation qui a créé ce mouvement : il suit ses modifications et disparaît avec elle. */
  factureId?: string;
  /**
   * Une remise à zéro faite toute seule à l'arrivée d'une facture d'aliment (ce qui restait de l'ancienne livraison est
   * consommé) : elle compte dans le « consommé » mais n'encombre pas la liste de l'historique.
   */
  automatique?: boolean;
  /** La boucle posée qui a créé ce mouvement (un retrait d'une boucle) : il se refait à chaque synchronisation avec le cheptel. */
  boucleId?: string;
  /** Pour des fromages fabriqués : les litres de lait qu'il a fallu (facultatif), pour connaître le lait par fromage. */
  litres?: number;
}

/** Un article ajouté par l'utilisateur, avec le nom qu'il veut (un fromage, un emballage ou du matériel de plus). */
export interface ArticleStock {
  id: string;
  genre: GenreArticle;
  nom: string;
  /** L'espèce pour laquelle l'article est tenu ; absente : pour toutes les activités de l'exploitation (le cas d'office). */
  activite?: string;
  /** Pour un article personnalisé : la liste (de la structure des catégories) qui le contient. */
  listeId?: string;
}

/**
 * Une liste que l'utilisateur ajoute à une catégorie de l'inventaire. Elle correspond impérativement à un compte du plan
 * comptable (6 chiffres, dont les premiers sont ceux que la catégorie autorise).
 */
export interface ListeInventaire {
  id: string;
  /** La catégorie d'office (« produits_finis »…) ou une catégorie ajoutée (« perso:… », voir CategorieInventairePerso). */
  categorie: string;
  nom: string;
  /** Le numéro du compte du plan comptable de la liste. */
  compte: string;
  /** Le libellé du compte au moment du choix (affiché sous le titre de la liste). */
  libelleCompte: string;
  /** Les espèces pour lesquelles la liste est retirée de l'inventaire (le compte a été retiré pour elles) ; elle reste pour les autres. */
  masquePour?: string[];
}

/**
 * Une catégorie que l'utilisateur ajoute à l'inventaire, au même titre que « 32. Autres approvisionnements » : son nom, sa
 * classe du plan comptable et les débuts de compte (de 2 à 6 chiffres) que ses listes peuvent avoir.
 */
export interface CategorieInventairePerso {
  id: string;
  nom: string;
  /** Le numéro de classe affiché devant le nom (« 36 »). */
  classe: string;
  /** Les débuts de compte autorisés pour ses listes (« 701 », « 21 »). */
  prefixes: string[];
}

/** Ce qu'on a changé d'une catégorie d'office : seulement ce qui diffère de l'origine. */
export interface ReglageCategorie {
  nom?: string;
  classe?: string;
  /** Les débuts de compte que ses listes peuvent avoir. */
  prefixes?: string[];
}

/** Une boucle de l'inventaire : son numéro, d'où elle vient (l'achat) et, quand elle est posée, sur quel animal. */
export interface BoucleStock {
  id: string;
  /** L'article de l'inventaire (« boucle:boucles » ou « boucle:rouges »). */
  article: string;
  /** Le numéro, tel qu'il s'écrit sur l'animal (sans l'indicatif de marquage). */
  numero: string;
  /** L'espèce dont la boucle est (chaque espèce a ses boucles) ; absente d'une ancienne boucle : l'espèce par défaut de l'établissement. */
  espece?: string;
  /** La date de l'achat (celle de la facture) ; absente d'une boucle ajoutée depuis la fiche d'un animal. */
  dateAchat?: string;
  /** Vrai pour une boucle ajoutée toute seule quand un animal a été enregistré avec un numéro absent de l'inventaire. */
  depuisCheptel?: boolean;
  /** La facture d'achat qui a créé la boucle : la boucle suit ses modifications et disparaît avec elle. */
  factureId?: string;
  /** Posée : l'animal qui la porte, et la date de pose (celle du bouclage de l'animal, quand elle est renseignée). */
  chevreId?: string;
  datePose?: string;
  /** Une exception notée à la main, en texte libre (commandée en trop, jamais posée…). */
  remarque?: string;
}

/**
 * Un fromage identifié, comme une chèvre : son numéro de lot, sa fabrication et, quand il est sorti du stock, sa vente (la date et
 * la vente) ou son rappel. Un fromage est contrôlé avant d'être vendu : la case « contrôle ok ».
 */
export interface LotFromage {
  id: string;
  /** L'article de l'inventaire (« fromage:frais »…). */
  article: string;
  /** Le numéro du lot : celui du fromage. */
  numero: string;
  dateFabrication: string;
  /** Le mouvement de stock de la fabrication (celui qui a fait entrer ses lots, avec le lait utilisé) : sa date suit celle de la fabrication. */
  mouvementId?: string;
  /** Vendu : la date de la vente et la vente (les fromages d'une vente se choisissent dans son formulaire). */
  dateVente?: string;
  venteId?: string;
  /** Rappelé : la date du rappel. Un fromage rappelé n'est plus au stock. */
  dateRappel?: string;
  /** Le rappel est validé (fait) : la date de la validation. */
  dateRappelValide?: string;
  /** Le contrôle du fromage est bon. */
  controleOk?: boolean;
}

/** Le lait produit un jour : son litrage (chèvres et brebis). */
export interface LaitJour {
  id: string;
  /** AAAA-MM-JJ */
  date: string;
  litres: number;
}

/**
 * Tout le stock d'un établissement : les mouvements (le niveau est leur somme), les articles ajoutés, et les emballages
 * consommés par fromage vendu quand ils ont été personnalisés (codes des emballages, d'office ou ajoutés).
 */
export interface ArchiveStock {
  mouvements: MouvementStock[];
  articles: ArticleStock[];
  /** Par fromage (son code, ou l'identifiant d'un fromage ajouté) : les emballages consommés par fromage vendu. */
  conditionnements: Record<string, string[]>;
  /**
   * Le conditionnement personnalisé pour une année : année → code du fromage → ses emballages. Il vaut pour cette année et les suivantes,
   * jusqu'à une nouvelle personnalisation ; les années d'avant gardent leur conditionnement (celui-ci, d'office, sinon).
   */
  conditionnementsParAnnee?: Record<string, Record<string, string[]>>;
  /** L'ordre choisi des articles de chaque genre (leurs identifiants) : ceux qui n'y sont pas suivent, dans l'ordre d'office. */
  ordres: Partial<Record<GenreArticle, string[]>>;
  /** Le nom choisi pour un article d'office (fromage, emballage ou matériel de départ), par identifiant d'article. */
  noms: Record<string, string>;
  /** Le lait produit, jour par jour. */
  lait: LaitJour[];
  /** Le prix de vente d'un fromage ou d'une viande (€, par identifiant d'article) : il préremplit le prix d'une vente. */
  prix: Record<string, number>;
  /** Les litres de lait qu'il faut pour un fromage (par identifiant d'article) : la fabrication en déduit le lait utilisé, et la rentabilité compare le fromage à la vente du lait. */
  litresParFromage?: Record<string, number>;
  /** Les listes que l'utilisateur a ajoutées aux catégories de l'inventaire. */
  listes?: ListeInventaire[];
  /** Les catégories que l'utilisateur a ajoutées à l'inventaire (avec leurs propres listes). */
  categories?: CategorieInventairePerso[];
  /** Ce que l'utilisateur a personnalisé d'une catégorie d'office (par identifiant) : il remplace le nom, le numéro ou les comptes d'origine. */
  reglagesCategories?: Record<string, ReglageCategorie>;
  /** Les boucles d'identification de l'inventaire, une par numéro. */
  boucles?: BoucleStock[];
  /** Les fromages identifiés (un par numéro de lot), fabriqués puis vendus ou rappelés. */
  lots?: LotFromage[];
  /** Les articles d'office supprimés par l'utilisateur (leur identifiant « genre:code ») : ils n'apparaissent plus. */
  masques?: string[];
  /** Les listes d'office retirées pour des espèces (section → espèces) : le compte de la liste a été retiré pour elles. */
  sectionsMasquees?: Record<string, string[]>;
}
