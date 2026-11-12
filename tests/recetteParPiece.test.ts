import { describe, expect, it } from 'vitest';
import { ingredientsProposables } from '@/features/production/services/ingredientsPlat';
import { lireArchiveStock } from '@/features/stock/repository';
import { CLE_LAIT } from '@/features/stock/services/historiqueLait';
import { enregistrerRecette, fabriquerFromages, ingredientsDeLaRecette, quantiteDeLaFabrication } from '@/features/stock/services/lots';

describe('une recette se rédige pour une pièce : les quantités se calculent pour la fabrication', () => {
  it('le nombre de pièces multiplie les quantités de la recette', async () => {
    await enregistrerRecette({
      id: 'rp1',
      produit: 'fromage',
      article: 'fromage:brocciu',
      nom: 'Brocciu',
      ingredients: [
        { article: 'materiel:sel', quantite: 0.5 },
        { article: CLE_LAIT, quantite: 2 },
      ],
    });
    const archive = await lireArchiveStock();
    expect(ingredientsDeLaRecette(archive, 'fromage', 'fromage:brocciu', 4)).toEqual([
      { article: 'materiel:sel', quantite: 2, lotIds: [] },
      { article: CLE_LAIT, quantite: 8, lotIds: [] },
    ]);
  });

  it('sans recette pour l’article, rien ne sort de la recette du produit entier', async () => {
    const archive = await lireArchiveStock();
    expect(ingredientsDeLaRecette(archive, 'fromage', 'fromage:crottin', 3)).toEqual([]);
  });

  it('les quantités s’arrondissent au millième', () => {
    expect(quantiteDeLaFabrication(0.333, 3)).toBe(0.999);
    expect(quantiteDeLaFabrication(1, 2.5)).toBe(2.5);
  });

  it('le lait de chèvre est proposé comme ingrédient d’un fromage, rangé sous « Lait »', async () => {
    const archive = await lireArchiveStock();
    const lait = ingredientsProposables(archive, {}, { fromagerie: true }).find((a) => a.cle === CLE_LAIT);
    expect(lait?.groupe).toBe('Lait');
  });

  it('le lait pris par la recette d’un fromage sort en litres, sans mouvement de stock pour le lait', async () => {
    await fabriquerFromages({
      article: 'fromage:brocciu',
      date: '2026-10-24',
      quantite: 2,
      debut: 'FB26297-1',
      ingredients: [
        { article: CLE_LAIT, quantite: 4, lotIds: [] },
        { article: 'materiel:sel', quantite: 1, lotIds: [] },
      ],
    });
    const archive = await lireArchiveStock();
    const entree = archive.mouvements.find((m) => m.article === 'fromage:brocciu' && m.delta === 2 && m.date === '2026-10-24');
    expect(entree?.litres).toBe(4);
    expect(archive.mouvements.some((m) => m.article === CLE_LAIT)).toBe(false);
    expect(archive.mouvements.find((m) => m.article === 'materiel:sel' && m.date === '2026-10-24')?.delta).toBe(-1);
  });
});
