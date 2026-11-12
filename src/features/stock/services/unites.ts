import { GENRE_ARTICLE, NATURE_PAR_GENRE, NATURE_STOCK } from '@/shared/constants/stock';

/** L'unité d'un emballage ou d'un fromage sans unité choisie : on les compte à la pièce. */
export const UNITE_PAR_DEFAUT_PIECE = 'pièce';

/**
 * Les articles qui se comptent dans une unité choisie : les consommables et les immobilisations (matériel, bâtiment). Les aliments restent au kilo, et
 * les produits vendus (fromages, viande, plats, savons) se comptent à la pièce, sans unité à choisir.
 */
export const genreAvecUnite = (genre: string): boolean =>
  genre !== GENRE_ARTICLE.ALIMENT &&
  (NATURE_PAR_GENRE[genre as keyof typeof NATURE_PAR_GENRE] === NATURE_STOCK.CONSOMMABLE ||
    NATURE_PAR_GENRE[genre as keyof typeof NATURE_PAR_GENRE] === NATURE_STOCK.INVESTISSEMENT);

/**
 * Les unités d'une quantité de stock : le sel se compte en kilos, le matériel en pièces, le liquide en litres. Une recette peut demander le sel en grammes :
 * la fabrication le convertit dans l'unité du stock (25 kg de sel, une recette à 2 g, sort 0,002 kg). Deux unités se convertissent entre elles seulement
 * quand elles sont de la même famille (masse, volume).
 */
export const UNITES_STOCK = [
  { cle: 'pièce', libelle: 'pièce' },
  { cle: 'L', libelle: 'litre' },
  { cle: 'kg', libelle: 'kilogramme' },
] as const;

/** La famille et la taille de chaque unité : la quantité en unité de base de sa famille (le gramme, le centilitre, la pièce). */
const FAMILLES: Record<string, { famille: string; taille: number }> = {
  g: { famille: 'masse', taille: 1 },
  kg: { famille: 'masse', taille: 1000 },
  cl: { famille: 'volume', taille: 1 },
  L: { famille: 'volume', taille: 100 },
  pièce: { famille: 'pièce', taille: 1 },
};

/** Combien vaut une unité `de` en unité `vers` (1 kg = 1000 g) ; rien quand les unités ne se convertissent pas. */
export function facteurDeConversion(de: string, vers: string): number | undefined {
  const a = FAMILLES[de];
  const b = FAMILLES[vers];
  if (!a || !b || a.famille !== b.famille) return undefined;
  return a.taille / b.taille;
}

/**
 * La quantité d'une recette dans l'unité du stock. Sans unité de recette, ou sans unité de stock, ou quand les deux ne se convertissent pas : la quantité
 * est gardée telle quelle (l'ancien comportement, quand tout était compté dans la même unité).
 */
export function quantiteDansLUniteDuStock(quantite: number, uniteRecette?: string, uniteStock?: string): number {
  if (!uniteRecette || !uniteStock) return quantite;
  const facteur = facteurDeConversion(uniteRecette, uniteStock);
  return facteur === undefined ? quantite : quantite * facteur;
}
