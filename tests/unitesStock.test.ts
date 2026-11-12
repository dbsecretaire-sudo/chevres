import { describe, expect, it } from 'vitest';
import { lireArchiveStock } from '@/features/stock/repository';
import { enregistrerRecette, ingredientsDeLaRecette } from '@/features/stock/services/lots';
import { definirUniteArticle } from '@/features/stock/services/stock';
import { facteurDeConversion, quantiteDansLUniteDuStock } from '@/features/stock/services/unites';

describe('unités de la quantité en stock', () => {
  it('une unité se convertit dans une unité de sa famille, jamais dans une autre', () => {
    expect(facteurDeConversion('g', 'kg')).toBe(0.001);
    expect(facteurDeConversion('kg', 'g')).toBe(1000);
    expect(facteurDeConversion('cl', 'L')).toBe(0.01);
    expect(facteurDeConversion('L', 'cl')).toBe(100);
    expect(facteurDeConversion('pièce', 'pièce')).toBe(1);
    expect(facteurDeConversion('g', 'pièce')).toBeUndefined();
  });

  it('une quantité de recette passe dans l’unité du stock ; sans unité des deux côtés, elle reste telle quelle', () => {
    expect(quantiteDansLUniteDuStock(2, 'g', 'kg')).toBeCloseTo(0.002, 9);
    expect(quantiteDansLUniteDuStock(1.5, 'kg', 'g')).toBe(1500);
    expect(quantiteDansLUniteDuStock(3, undefined, 'kg')).toBe(3);
    expect(quantiteDansLUniteDuStock(3, 'g', undefined)).toBe(3);
    expect(quantiteDansLUniteDuStock(3, 'g', 'pièce')).toBe(3);
  });

  it('une fabrication sort du stock la quantité de la recette convertie dans l’unité de l’ingrédient', async () => {
    await definirUniteArticle('materiel:sel', 'kg');
    await enregistrerRecette({
      id: 'unite-sel',
      produit: 'fromage',
      article: 'fromage:tomme',
      nom: 'Tomme',
      ingredients: [
        { article: 'materiel:sel', quantite: 2, unite: 'g' },
        { article: 'materiel:presure', quantite: 1, unite: 'pièce' },
      ],
    });
    const archive = await lireArchiveStock();
    const ingredients = ingredientsDeLaRecette(archive, 'fromage', 'fromage:tomme', 4);
    // 2 g pour une pièce, quatre pièces : 8 g, soit 0,008 kg de sel en stock.
    expect(ingredients.find((i) => i.article === 'materiel:sel')?.quantite).toBeCloseTo(0.008, 9);
    expect(ingredients.find((i) => i.article === 'materiel:presure')?.quantite).toBe(4);
  });
});
