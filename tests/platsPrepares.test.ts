import { describe, expect, it } from 'vitest';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  articlesDuProduit,
  estArticleAvecLots,
  fabriquerFromages,
  fabriquerPlats,
  numeroDeLot,
} from '@/features/stock/services/lots';
import { ajouterArticle, niveauxDeStock } from '@/features/stock/services/stock';
import { FILTRE_STOCK_TOUT, GENRE_ARTICLE, PRODUIT_A_LOTS } from '@/shared/constants/stock';

describe('plats préparés', () => {
  it('un plat est un article suivi par lot, avec un numéro qui commence par P', async () => {
    const cle = await ajouterArticle(GENRE_ARTICLE.PLAT, 'Civet de sanglier');
    expect(estArticleAvecLots(cle)).toBe(true);
    const archive = await lireArchiveStock();
    expect(
      articlesDuProduit(PRODUIT_A_LOTS.PLAT, archive, FILTRE_STOCK_TOUT as never).map((a) => a.libelle),
    ).toContain('Civet de sanglier');
    expect(numeroDeLot(archive, cle, '2026-10-22')).toMatch(/^PC26295-1$/);
  });

  it('fabriquer des plats les fait entrer au stock, sort les ingrédients et garde leurs lots, la stérilisation et la durabilité', async () => {
    const plat = await ajouterArticle(GENRE_ARTICLE.PLAT, 'Soupe de châtaignes');
    await fabriquerFromages({ article: 'fromage:frais', date: '2026-09-01', quantite: 3, debut: 'FF2612-1' });
    const avant = await lireArchiveStock();
    const fromages = (avant.lots ?? []).filter((l) => l.article === 'fromage:frais');
    expect(fromages).toHaveLength(3);
    await fabriquerPlats({
      article: plat,
      date: '2026-10-22',
      quantite: 4,
      debut: 'PS26295-1',
      dateSterilisation: '2026-10-22',
      ddm: '2028-10-22',
      ingredients: [{ article: 'fromage:frais', quantite: 2, lotIds: [fromages[0].id, fromages[1].id] }],
    });
    const archive = await lireArchiveStock();
    const niveaux = niveauxDeStock(archive.mouvements);
    expect(niveaux.get(plat)).toBe(4);
    expect(niveaux.get('fromage:frais')).toBe(1);
    const lots = archive.lots ?? [];
    expect(lots.filter((l) => l.article === plat).map((l) => l.numero)).toEqual([
      'PS26295-1',
      'PS26295-2',
      'PS26295-3',
      'PS26295-4',
    ]);
    expect(
      lots
        .filter((l) => l.article === 'fromage:frais' && l.venteId)
        .map((l) => l.id)
        .sort(),
    ).toEqual([fromages[0].id, fromages[1].id].sort());
    const mouvementId = lots.find((l) => l.article === plat)!.mouvementId as string;
    expect(archive.platsFabriques?.[mouvementId]).toMatchObject({
      dateSterilisation: '2026-10-22',
      ddm: '2028-10-22',
    });
    expect(archive.platsFabriques?.[mouvementId].ingredients[0].lotIds).toHaveLength(2);
  });

  it('refuse un numéro déjà pris', async () => {
    const plat = await ajouterArticle(GENRE_ARTICLE.PLAT, 'Pâté');
    await fabriquerPlats({
      article: plat,
      date: '2026-10-22',
      quantite: 2,
      debut: 'PP26295-1',
      ingredients: [],
    });
    await expect(
      fabriquerPlats({ article: plat, date: '2026-10-22', quantite: 2, debut: 'PP26295-2', ingredients: [] }),
    ).rejects.toThrow();
  });
});
