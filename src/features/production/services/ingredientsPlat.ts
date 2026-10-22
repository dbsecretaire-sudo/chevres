import { choixParDefaut, lotsPourVisite } from '@/features/commercial/services/stockVisite';
import { articlesDuGenre, estLigneDuCheptel, type ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { GENRE_ARTICLE } from '@/shared/constants/stock';

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
  groupes: { fromages: string; charcuterie: string; autres: string },
): IngredientProposable[] {
  return [
    ...articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive).map((a) => ({ ...a, groupe: groupes.fromages })),
    ...articlesDuGenre(GENRE_ARTICLE.VIANDE, archive)
      .filter((a) => !estLigneDuCheptel(a.cle))
      .map((a) => ({ ...a, groupe: groupes.charcuterie })),
    ...articlesDuGenre(GENRE_ARTICLE.PERSONNALISE, archive).map((a) => ({ ...a, groupe: groupes.autres })),
  ];
}

/** Un ingrédient en cours de saisie : la quantité reste du texte ; les lots choisis (absents : les plus anciens, d'office). */
export interface SaisieIngredient {
  cle: string;
  article: string;
  quantite: string;
  lotIds?: string[];
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
