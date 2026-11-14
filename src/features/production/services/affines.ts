import { estArticleFromage, ingredientsDeLaRecette } from '@/features/stock/services/lots';
import type { ArchiveStock } from '@/features/stock/types';

/**
 * Un affiné se fait d'un fromage déjà fait : les fromages de sa recette (frais, crottin, brocciu…) sortent du stock, par les lots qu'on choisit.
 * Ces fromages, avec ce que la recette en prend pour une pièce.
 */
export function fromagesAffinables(archive: ArchiveStock, produit: string, article: string): { article: string; parPiece: number }[] {
  return ingredientsDeLaRecette(archive, produit, article, 1)
    .filter((i) => estArticleFromage(i.article))
    .map((i) => ({ article: i.article, parPiece: i.quantite }));
}

/**
 * Le nombre d'affinés que les lots choisis permettent : pour le fromage de la recette qui en manque le plus, autant de pièces que de lots choisis
 * divisés par ce que la recette en prend par pièce. Zéro sans fromage dans la recette, ou sans lot choisi.
 */
export function affinesPossibles(
  archive: ArchiveStock | null,
  produit: string,
  article: string,
  lotsChoisis: Record<string, string[]>,
): number {
  if (!archive || !article) return 0;
  const fromages = fromagesAffinables(archive, produit, article).filter((f) => f.parPiece > 0);
  if (fromages.length === 0) return 0;
  return Math.min(...fromages.map((f) => Math.floor((lotsChoisis[f.article]?.length ?? 0) / f.parPiece)));
}
