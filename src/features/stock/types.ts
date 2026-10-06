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
}
