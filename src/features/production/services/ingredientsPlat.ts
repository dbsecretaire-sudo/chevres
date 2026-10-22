import { choixParDefaut, lotsPourVisite } from '@/features/commercial/services/stockVisite';
import {
  articlesDuGenre,
  estLigneDuCheptel,
  libelleArticle,
  niveauxDeStock,
  type ArticleAffiche,
} from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { GENRE_ARTICLE, INGREDIENTS_DE_FROMAGERIE } from '@/shared/constants/stock';

/** Un article du stock qu'un plat peut utiliser, rangé par groupe (fromages, charcuterie et viande, autres articles). */
export interface IngredientProposable extends ArticleAffiche {
  groupe: string;
}

/**
 * Les articles du stock qu'un plat préparé peut demander : les fromages, la charcuterie et la viande (hors les lignes qui suivent le cheptel), puis les
 * articles des listes que l'utilisateur a ajoutées à l'inventaire (légumes, bocaux, épices…).
 */
export function ingredientsProposables(
  archive: ArchiveStock,
  groupes: { fromages: string; charcuterie: string; autres: string; fromagerie?: string },
  /**
   * Un savon n'a pour ingrédients que les articles des listes de l'inventaire (huiles, soude, beurres…), ni fromage ni viande ; un fromage ou une charcuterie, la
   * présure, le sel et les ferments (`fromagerie`) avec ces listes.
   */
  options: { listesSeulement?: boolean; fromagerie?: boolean } = {},
): IngredientProposable[] {
  const nomsDesListes = new Map((archive.listes ?? []).map((l) => [l.id, l.nom]));
  const produits = options.fromagerie
    ? articlesDuGenre(GENRE_ARTICLE.MATERIEL, archive)
        .filter((a) => INGREDIENTS_DE_FROMAGERIE.includes(a.cle.split(':')[1]))
        .map((a) => ({ ...a, groupe: groupes.fromagerie ?? groupes.autres }))
    : options.listesSeulement
      ? []
      : [
        ...articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive).map((a) => ({ ...a, groupe: groupes.fromages })),
        ...articlesDuGenre(GENRE_ARTICLE.VIANDE, archive)
          .filter((a) => !estLigneDuCheptel(a.cle))
          .map((a) => ({ ...a, groupe: groupes.charcuterie })),
      ];
  return [
    ...produits,
    // Chaque article d'une liste ajoutée se range sous le nom de sa liste (« Matières alimentaires consommables »).
    ...articlesDuGenre(GENRE_ARTICLE.PERSONNALISE, archive).map((a) => ({
      ...a,
      groupe: nomsDesListes.get(archive.articles.find((x) => x.id === a.id)?.listeId ?? '') ?? groupes.autres,
    })),
  ];
}

/** Un ingrédient en cours de saisie : la quantité reste du texte ; les lots choisis (absents : les plus anciens, d'office). */
export interface SaisieIngredient {
  cle: string;
  article: string;
  quantite: string;
  lotIds?: string[];
}

/** Un ingrédient dont le stock ne suffit pas : ce qu'il y a, ce qui est demandé. */
export interface IngredientEnManque {
  libelle: string;
  enStock: number;
  demande: number;
}

/**
 * Les ingrédients d'une fabrication dont le stock ne suffit pas (huile, soude, présure, sel…) : sans cela le stock passerait en négatif sans prévenir. Un même
 * article cité deux fois compte pour la somme de ses quantités.
 */
export function ingredientsEnManque(
  archive: ArchiveStock,
  utilises: { article: string; quantite: number }[],
): IngredientEnManque[] {
  const niveaux = niveauxDeStock(archive.mouvements);
  const demandes = new Map<string, number>();
  for (const u of utilises) demandes.set(u.article, (demandes.get(u.article) ?? 0) + u.quantite);
  const arrondi = (n: number) => Math.round(n * 1000) / 1000;
  return [...demandes]
    .map(([article, demande]) => ({
      libelle: libelleArticle(article, archive),
      enStock: arrondi(niveaux.get(article) ?? 0),
      demande: arrondi(demande),
    }))
    .filter((i) => i.demande > i.enStock);
}

/** Les lots qu'un ingrédient peut prendre (ceux en stock, les plus anciens d'abord) : rien pour un article sans suivi par lot. */
export const lotsDeLIngredient = (archive: Pick<ArchiveStock, 'lots'>, article: string): LotFromage[] =>
  lotsPourVisite(archive, article);

/** Les lots pris pour un ingrédient : ceux choisis, sinon les plus anciens, autant que la quantité entière demandée. */
export function lotsPrisPourIngredient(
  archive: Pick<ArchiveStock, 'lots'>,
  ingredient: Pick<SaisieIngredient, 'article' | 'lotIds'>,
  quantite: number,
): string[] {
  if (ingredient.lotIds) return ingredient.lotIds;
  return choixParDefaut([{ article: ingredient.article, quantite }], archive)[0]?.lotIds ?? [];
}
