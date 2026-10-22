import { describe, expect, it } from 'vitest';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  articlesDuProduit,
  estArticleAvecLots,
  fabriquerFromages,
  fabriquerPlats,
  lotsARappeler,
  lotsDePlatsUtilisant,
  numeroDeLot,
  articleDeLaVente,
  fromagesRequis,
  synchroniserLotsVente,
  rappelerLots,
} from '@/features/stock/services/lots';
import type { Vente } from '@/features/comptabilite/types';
import { detailDuLotDePlat } from '@/features/stock/services/detailDuPlat';
import { estLigneDeViande } from '@/features/commercial/services/commandes';
import { ajouterArticle, consommationDeLaVente, niveauxDeStock } from '@/features/stock/services/stock';
import { CATEGORIE_VENTE, UNITE_VENTE } from '@/shared/constants/comptabilite';
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

describe('rappel d’un plat dont un ingrédient n’est pas conforme', () => {
  it('propose le plat à rappeler avec son ingrédient non conforme, et le rappelle en même temps', async () => {
    const plat = await ajouterArticle(GENRE_ARTICLE.PLAT, 'Quiche');
    await fabriquerFromages({
      article: 'fromage:affine',
      date: '2026-09-02',
      quantite: 2,
      debut: 'FV2612-1',
    });
    const avant = await lireArchiveStock();
    const [lotA, lotB] = (avant.lots ?? []).filter((l) => l.article === 'fromage:affine');
    await fabriquerPlats({
      article: plat,
      date: '2026-10-22',
      quantite: 2,
      debut: 'PQ26295-1',
      ingredients: [{ article: 'fromage:affine', quantite: 1, lotIds: [lotA.id] }],
    });
    const archive = await lireArchiveStock();
    const platsFaits = (archive.lots ?? []).filter((l) => l.article === plat);
    // Les lots de plats sont ceux qui ont servi : seuls ceux faits avec le lot A le sont.
    expect(
      lotsDePlatsUtilisant(archive, [lotA.id])
        .map((l) => l.id)
        .sort(),
    ).toEqual(platsFaits.map((l) => l.id).sort());
    expect(lotsDePlatsUtilisant(archive, [lotB.id])).toEqual([]);
    // Le lot A (utilisé = vendu, contrôle non ok) est à rappeler, et les plats avec lui, même contrôlés.
    const aRappeler = lotsARappeler(archive).map((l) => l.id);
    expect(aRappeler).toContain(lotA.id);
    for (const p of platsFaits) expect(aRappeler).toContain(p.id);
    expect(lotsARappeler(archive, plat)).toHaveLength(2);
    // Rappeler l'ingrédient rappelle les plats.
    await rappelerLots([lotA.id], '2026-10-23');
    const apres = await lireArchiveStock();
    for (const p of (apres.lots ?? []).filter((l) => l.article === plat))
      expect(p.dateRappel).toBe('2026-10-23');
    expect(niveauxDeStock(apres.mouvements).get(plat)).toBe(0);
  });
});

describe('vente d’un plat préparé', () => {
  it('se vend comme la charcuterie : détail de la vente, sortie du stock, choix des lots', async () => {
    const plat = await ajouterArticle(GENRE_ARTICLE.PLAT, 'Daube de sanglier');
    await fabriquerPlats({
      article: plat,
      date: '2026-10-22',
      quantite: 3,
      debut: 'PD26295-1',
      ingredients: [],
    });
    const archive = await lireArchiveStock();
    const vente = {
      id: 'v-plat',
      date: '2026-10-25',
      categorie: CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE,
      precision: 'Daube de sanglier',
      quantite: 2,
      unite: UNITE_VENTE.PIECE,
      prix: 24,
    } as Vente;
    expect(articleDeLaVente(vente, archive)).toBe(plat);
    expect(consommationDeLaVente(vente, archive)[0]).toEqual({ article: plat, quantite: 2 });
    // Il a des lots en stock : la vente doit désigner les siens.
    expect(fromagesRequis(archive, vente)).toBe(true);
    const [un, deux] = (archive.lots ?? []).filter((l) => l.article === plat);
    expect(fromagesRequis(archive, { ...vente, fromages: `${un.id};${deux.id}` })).toBe(false);
    await synchroniserLotsVente({ id: vente.id, date: vente.date, fromages: `${un.id};${deux.id}` });
    const apres = await lireArchiveStock();
    expect((apres.lots ?? []).filter((l) => l.venteId === 'v-plat')).toHaveLength(2);
    expect(estLigneDeViande(plat)).toBe(true);
  });
});

describe('détail d’un lot de plat', () => {
  it('dit la stérilisation, la durabilité et les ingrédients avec leurs lots', async () => {
    const plat = await ajouterArticle(GENRE_ARTICLE.PLAT, 'Tourte');
    await fabriquerFromages({
      article: 'fromage:crottin',
      date: '2026-09-03',
      quantite: 2,
      debut: 'FC2612-1',
    });
    const [crottin] = ((await lireArchiveStock()).lots ?? []).filter((l) => l.article === 'fromage:crottin');
    await fabriquerPlats({
      article: plat,
      date: '2026-10-22',
      quantite: 2,
      debut: 'PT26295-1',
      dateSterilisation: '2026-10-22',
      ddm: '2028-10-22',
      ingredients: [{ article: 'fromage:crottin', quantite: 1.5, lotIds: [crottin.id] }],
    });
    const archive = await lireArchiveStock();
    const lotDePlat = (archive.lots ?? []).find((l) => l.article === plat)!;
    const lignes = detailDuLotDePlat(lotDePlat, archive);
    expect(lignes[0]).toContain('Stérilisé le');
    expect(lignes[0]).toContain('DDM');
    expect(lignes[1]).toContain('1,5 × Crottin');
    expect(lignes[1]).toContain(crottin.numero);
    // Un lot qui n'est pas un plat n'a pas de détail.
    expect(detailDuLotDePlat(crottin, archive)).toEqual([]);
  });
});
