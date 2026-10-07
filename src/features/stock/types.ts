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
  /** L'ordre choisi des articles de chaque genre (leurs identifiants) : ceux qui n'y sont pas suivent, dans l'ordre d'office. */
  ordres: Partial<Record<GenreArticle, string[]>>;
  /** Le nom choisi pour un article d'office (fromage, emballage ou matériel de départ), par identifiant d'article. */
  noms: Record<string, string>;
  /** Le lait produit, jour par jour. */
  lait: LaitJour[];
  /** Le prix de vente d'un fromage ou d'une viande (€, par identifiant d'article) : il préremplit le prix d'une vente. */
  prix: Record<string, number>;
  /** Les listes que l'utilisateur a ajoutées aux catégories de l'inventaire. */
  listes?: ListeInventaire[];
  /** Les catégories que l'utilisateur a ajoutées à l'inventaire (avec leurs propres listes). */
  categories?: CategorieInventairePerso[];
  /** Les articles d'office supprimés par l'utilisateur (leur identifiant « genre:code ») : ils n'apparaissent plus. */
  masques?: string[];
}
