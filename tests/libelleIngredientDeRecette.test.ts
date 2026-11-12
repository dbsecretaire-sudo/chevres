import { describe, expect, it } from 'vitest';
import { lireArchiveStock } from '@/features/stock/repository';
import { libelleIngredientDeRecette } from '@/features/production/services/ingredientsPlat';

describe('ingrédients d’une recette, en phrase', () => {
  it('le lait se dit en litres, au pluriel dès deux litres', async () => {
    const archive = await lireArchiveStock();
    expect(libelleIngredientDeRecette({ article: 'lait', quantite: 3 }, archive)).toBe('3 litres de lait de chèvre');
    expect(libelleIngredientDeRecette({ article: 'lait', quantite: 1 }, archive)).toBe('1 litre de lait de chèvre');
  });

  it('l’unité enregistrée de la recette, puis celle du stock, s’écrit avant le nom', async () => {
    const archive = { ...(await lireArchiveStock()), unites: { 'materiel:sel': 'g' } };
    expect(libelleIngredientDeRecette({ article: 'materiel:sel', quantite: 2 }, archive)).toBe('2 g de sel');
    expect(libelleIngredientDeRecette({ article: 'materiel:sel', quantite: 1.5, unite: 'kg' }, archive)).toBe('1,5 kg de sel');
  });

  it('moins d’un kilo se dit en grammes, moins d’un litre en centilitres, moins d’un centilitre en millilitres', async () => {
    const archive = await lireArchiveStock();
    expect(libelleIngredientDeRecette({ article: 'materiel:sel', quantite: 0.05, unite: 'kg' }, archive)).toBe('50 g de sel');
    expect(libelleIngredientDeRecette({ article: 'lait', quantite: 0.5 }, archive)).toBe('50 cl de lait de chèvre');
    expect(libelleIngredientDeRecette({ article: 'lait', quantite: 0.00035 }, archive)).toBe('0,35 ml de lait de chèvre');
    expect(libelleIngredientDeRecette({ article: 'materiel:huile', quantite: 0.5, unite: 'cl' }, archive)).toBe('5 ml d’huile');
  });

  it('une pièce reste au singulier pour une seule, et la voyelle prend l’apostrophe', async () => {
    const archive = await lireArchiveStock();
    expect(libelleIngredientDeRecette({ article: 'materiel:papier', quantite: 1, unite: 'pièce' }, archive)).toBe('1 pièce de papier');
    expect(libelleIngredientDeRecette({ article: 'materiel:papier', quantite: 4, unite: 'pièce' }, archive)).toBe('4 pièces de papier');
    expect(libelleIngredientDeRecette({ article: 'materiel:huile', quantite: 2, unite: 'cl' }, archive)).toBe('2 cl d’huile');
  });

  it('sans aucune unité, la quantité se dit devant le nom', async () => {
    const archive = await lireArchiveStock();
    expect(libelleIngredientDeRecette({ article: 'materiel:sel', quantite: 2 }, archive)).toBe('2 sel');
  });
});
