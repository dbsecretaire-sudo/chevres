import { describe, expect, it } from 'vitest';
import {
  ligneDeLaCategorie,
  ajouterArticle,
  niveauxDeStock,
  bilanLait,
} from '@/features/stock/services/stock';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  dossierEnRegle,
  etapesManquantes,
  finDeCureSiEnCure,
  lotVendable,
  rappelsDossiersSavons,
} from '@/features/stock/services/dossiersSavons';
import { rappelsAnalysesPlats } from '@/features/stock/services/analysesPlats';
import { detailDuLotDePlat } from '@/features/stock/services/detailDuPlat';
import {
  articlesDuProduit,
  enregistrerEtapeSavon,
  enregistrerInciSavon,
  fabriquerSavons,
  lotsAChoisir,
  lotsARappeler,
  numeroDeLot,
} from '@/features/stock/services/lots';
import { articlesDeBesoin } from '@/features/commercial/services/stockVisite';
import {
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  TAUX_TVA_VENTE_PAR_CATEGORIE,
} from '@/shared/constants/comptabilite';
import { COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';
import {
  ETAPES_SAVON_OBLIGATOIRES,
  FILTRE_STOCK_TOUT,
  GENRE_ARTICLE,
  PRODUIT_A_LOTS,
} from '@/shared/constants/stock';

describe('savons au lait de chèvre', () => {
  it('un savon est un article suivi par lot, numéroté en S', async () => {
    const cle = await ajouterArticle(GENRE_ARTICLE.SAVON, 'Savon lait de chèvre et miel');
    const archive = await lireArchiveStock();
    expect(
      articlesDuProduit(PRODUIT_A_LOTS.SAVON, archive, FILTRE_STOCK_TOUT as never).map((a) => a.libelle),
    ).toContain('Savon lait de chèvre et miel');
    expect(numeroDeLot(archive, cle, '2026-10-22')).toBe('SS26295-1');
  });

  it('fabriquer des savons prend le lait du stock de lait, sort les huiles, et garde la saponification et la fin de cure', async () => {
    const savon = await ajouterArticle(GENRE_ARTICLE.SAVON, 'Savon à la lavande');
    const avant = await lireArchiveStock();
    const huile = avant.articles.find((a) => a.nom === 'Huile de coco');
    expect(huile).toBeDefined();
    const cleHuile = `${GENRE_ARTICLE.PERSONNALISE}:${huile!.id}`;
    await fabriquerSavons({
      article: savon,
      date: '2026-10-22',
      quantite: 6,
      debut: 'SL26295-1',
      litresLait: 1.5,
      dateSaponification: '2026-10-22',
      finCure: '2026-12-03',
      ddm: '2028-10-22',
      ingredients: [{ article: cleHuile, quantite: 2, lotIds: [] }],
    });
    const archive = await lireArchiveStock();
    const lots = (archive.lots ?? []).filter((l) => l.article === savon);
    expect(lots.map((l) => l.numero)).toEqual([
      'SL26295-1',
      'SL26295-2',
      'SL26295-3',
      'SL26295-4',
      'SL26295-5',
      'SL26295-6',
    ]);
    expect(niveauxDeStock(archive.mouvements).get(savon)).toBe(6);
    expect(niveauxDeStock(archive.mouvements).get(cleHuile)).toBe(-2);
    // Le lait est pris dans le stock de lait : le bilan du lait le compte comme utilisé.
    expect(bilanLait(archive, 0).utilise).toBe(1.5);
    const mouvementId = lots[0].mouvementId as string;
    expect(archive.platsFabriques?.[mouvementId]).toMatchObject({
      dateSaponification: '2026-10-22',
      finCure: '2026-12-03',
      litresLait: 1.5,
    });
    expect(detailDuLotDePlat(lots[0], archive).join(' | ')).toMatch(
      /Saponifié le .*Cure jusqu’au .*Lait de chèvre : 1,5 L/,
    );
  });

  it("un savon ne se vend qu'après sa cure et une fois son dossier réglementaire en règle", async () => {
    const savon = await ajouterArticle(GENRE_ARTICLE.SAVON, 'Savon au miel');
    await fabriquerSavons({
      article: savon,
      date: '2026-01-10',
      quantite: 2,
      debut: 'SM2610-1',
      finCure: '2026-02-21',
      ingredients: [],
    });
    let archive = await lireArchiveStock();
    const lot = (archive.lots ?? []).find((l) => l.article === savon)!;
    // En cure : rien à choisir, même avec un dossier en règle.
    for (const etape of ETAPES_SAVON_OBLIGATOIRES) await enregistrerEtapeSavon(savon, etape, { fait: true });
    archive = await lireArchiveStock();
    expect(dossierEnRegle(archive, savon)).toBe(true);
    expect(finDeCureSiEnCure(lot, archive, '2026-02-01')).toBe('2026-02-21');
    expect(lotsAChoisir(archive, savon, undefined, '2026-02-01')).toHaveLength(0);
    // La cure finie : les deux lots sont proposés.
    expect(lotsAChoisir(archive, savon, undefined, '2026-02-21')).toHaveLength(2);
    // Une étape défaite : plus de vente, et un rappel de dossier apparaît.
    await enregistrerEtapeSavon(savon, 'notification_cpnp', { fait: false });
    archive = await lireArchiveStock();
    expect(etapesManquantes(archive.dossiersSavons?.[savon])).toEqual(['notification_cpnp']);
    expect(lotVendable(lot, archive, '2026-03-01')).toBe(false);
    expect(lotsAChoisir(archive, savon, undefined, '2026-03-01')).toHaveLength(0);
    const rappels = rappelsDossiersSavons(archive, '2026-03-01').filter((r) => r.id.endsWith(savon));
    expect(rappels).toHaveLength(1);
    expect(rappels[0].detail).toMatch(/Notification CPNP/);
    // Un lot déjà dans une vente reste choisi par elle.
    expect(
      lotsAChoisir(
        { ...archive, lots: archive.lots?.map((l) => (l.id === lot.id ? { ...l, venteId: 'v1' } : l)) },
        savon,
        'v1',
        '2026-03-01',
      ),
    ).toHaveLength(1);
  });

  it('la liste INCI du dossier se garde', async () => {
    const savon = await ajouterArticle(GENRE_ARTICLE.SAVON, 'Savon INCI');
    await enregistrerInciSavon(savon, ' Sodium Olivate, Aqua ');
    expect((await lireArchiveStock()).dossiersSavons?.[savon].inci).toBe('Sodium Olivate, Aqua');
    await enregistrerInciSavon(savon, '');
    expect((await lireArchiveStock()).dossiersSavons?.[savon].inci).toBeUndefined();
  });

  it('un ingrédient non conforme rappelle aussi les savons faits avec lui', async () => {
    const savon = await ajouterArticle(GENRE_ARTICLE.SAVON, 'Savon rappel');
    const base = await lireArchiveStock();
    const lotsFromages = (base.lots ?? []).filter((l) => l.article.startsWith('fromage:'));
    // Un lot du stock sert d'ingrédient : le savon le cite.
    if (lotsFromages.length === 0) {
      const { fabriquerFromages } = await import('@/features/stock/services/lots');
      await fabriquerFromages({
        article: 'fromage:frais',
        date: '2026-05-01',
        quantite: 1,
        debut: 'FF2601-1',
      });
    }
    const archive0 = await lireArchiveStock();
    const ingredient = (archive0.lots ?? []).find(
      (l) => l.article.startsWith('fromage:') && !l.venteId && !l.dateRappel,
    )!;
    await fabriquerSavons({
      article: savon,
      date: '2026-05-02',
      quantite: 1,
      debut: 'SR2602-1',
      ingredients: [{ article: ingredient.article, quantite: 1, lotIds: [ingredient.id] }],
    });
    const archive = await lireArchiveStock();
    // L'ingrédient est « sorti » (utilisé) et son contrôle n'est pas ok : le savon est à rappeler.
    const dues = lotsARappeler({ lots: archive.lots, platsFabriques: archive.platsFabriques });
    expect(dues.some((l) => l.article === savon)).toBe(true);
  });

  it('les rappels d’analyse suivent chaque produit avec son intervalle', async () => {
    const archive = await lireArchiveStock();
    const savon = (archive.lots ?? []).find(
      (l) => l.article.startsWith('savon:') && !l.dateVente && !l.dateRappel,
    )!;
    const rappels = rappelsAnalysesPlats(archive, { savon: 30 }, '2030-01-01');
    expect(rappels.some((r) => r.fabricationId === savon.mouvementId)).toBe(true);
    // Sans intervalle pour les savons : aucun rappel pour eux.
    expect(
      rappelsAnalysesPlats(archive, { plat: 30 }, '2030-01-01').some(
        (r) => r.fabricationId === savon.mouvementId,
      ),
    ).toBe(false);
  });

  it('la vente de savons a sa catégorie, son compte, sa TVA à 20 % et ses propres lignes', async () => {
    expect(TAUX_TVA_VENTE_PAR_CATEGORIE[CATEGORIE_VENTE.SAVONS]).toBe(20);
    expect(COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.SAVONS].numero).toBe('701700');
    expect(ligneDeLaCategorie('savon:abc', CATEGORIE_VENTE.SAVONS)).toBe(true);
    expect(ligneDeLaCategorie('viande:saucisson', CATEGORIE_VENTE.SAVONS)).toBe(false);
    expect(ligneDeLaCategorie('savon:abc', CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE)).toBe(false);
    expect(ligneDeLaCategorie('viande:saucisson', CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE)).toBe(true);
    expect(ligneDeLaCategorie('viande:chevres_vivant', CATEGORIE_VENTE.VIANDE)).toBe(true);
  });

  it('les savons ne sont pas proposés aux formules d’agritourisme', async () => {
    const archive = await lireArchiveStock();
    const groupes = { fromages: 'F', charcuterie: 'C', plats: 'P', autres: 'A' };
    expect(articlesDeBesoin(archive, groupes).some((a) => a.cle.startsWith('savon:'))).toBe(false);
  });
});
