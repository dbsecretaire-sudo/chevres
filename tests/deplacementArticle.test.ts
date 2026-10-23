import { describe, expect, it } from 'vitest';
import { enregistrerFacture, listToutesFactures } from '@/features/comptabilite/repository/factures';
import { lireArchiveStock } from '@/features/stock/repository';
import { deplacerArticle, peutChangerDeCompte, remplacerCle } from '@/features/stock/services/deplacement';
import {
  ajouterArticle,
  ajouterMouvementManuel,
  articlesDuGenre,
  definirPrixArticle,
  definirPrixVifArticle,
  masquerArticle,
  roleDeLaViande,
} from '@/features/stock/services/stock';
import { GENRE_ARTICLE, ROLE_VIANDE } from '@/shared/constants/stock';

describe('remplacer un identifiant d’article', () => {
  it('le change dans les textes comme dans les noms de propriétés, sans toucher au reste', () => {
    const avant = { a: 'materiel:x', prix: { 'materiel:x': 12 }, liste: ['materiel:x', 'materiel:y'], autre: 'materiel:xx' };
    expect(remplacerCle(avant, 'materiel:x', 'aliment:x')).toEqual({
      a: 'aliment:x',
      prix: { 'aliment:x': 12 },
      liste: ['aliment:x', 'materiel:y'],
      autre: 'materiel:xx',
    });
  });
});

describe('changer un article de compte', () => {
  it('passe une immobilisation en matière première avec son stock, son prix et ses factures', async () => {
    const ancienne = await ajouterArticle(GENRE_ARTICLE.MATERIEL, 'Cuve à lait');
    await ajouterMouvementManuel(ancienne, 2, '2026-10-01');
    await definirPrixArticle(ancienne, 450);
    await enregistrerFacture({
      date: '2026-10-01',
      type: 'recue',
      tiers: 'Fournisseur',
      description: 'Achat',
      montant: 900,
      stockArticle: ancienne,
      stockQuantite: 2,
    } as never);

    const nouvelle = await deplacerArticle(ancienne, { genre: GENRE_ARTICLE.ALIMENT });
    expect(nouvelle.startsWith(`${GENRE_ARTICLE.ALIMENT}:`)).toBe(true);
    expect(nouvelle.split(':')[1]).toBe(ancienne.split(':')[1]);

    const archive = await lireArchiveStock();
    expect(archive.mouvements.some((m) => m.article === nouvelle)).toBe(true);
    expect(archive.mouvements.some((m) => m.article === ancienne)).toBe(false);
    expect(archive.prix[nouvelle]).toBe(450);
    expect(articlesDuGenre(GENRE_ARTICLE.ALIMENT, archive).map((a) => a.libelle)).toContain('Cuve à lait');
    expect(articlesDuGenre(GENRE_ARTICLE.MATERIEL, archive).map((a) => a.libelle)).not.toContain('Cuve à lait');
    expect((await listToutesFactures()).some((f) => f.stockArticle === nouvelle)).toBe(true);
  });

  it('un article d’office garde son nom, l’ancien est masqué', async () => {
    const archive = await lireArchiveStock();
    const dOffice = articlesDuGenre(GENRE_ARTICLE.MATERIEL, archive)[0];
    expect(dOffice).toBeDefined();
    const nouvelle = await deplacerArticle(dOffice.cle, { genre: GENRE_ARTICLE.ENTRETIEN });
    const apres = await lireArchiveStock();
    expect(apres.masques).toContain(dOffice.cle);
    expect(articlesDuGenre(GENRE_ARTICLE.ENTRETIEN, apres).map((a) => a.cle)).toContain(nouvelle);
    expect(articlesDuGenre(GENRE_ARTICLE.ENTRETIEN, apres).find((a) => a.cle === nouvelle)?.libelle).toBe(dOffice.libelle);
  });

  it('un article d’office se supprime en le masquant', async () => {
    const archive = await lireArchiveStock();
    const cle = articlesDuGenre(GENRE_ARTICLE.ALIMENT, archive)[0].cle;
    await masquerArticle(cle);
    expect(articlesDuGenre(GENRE_ARTICLE.ALIMENT, await lireArchiveStock()).map((a) => a.cle)).not.toContain(cle);
  });
});

describe('prix au kilo vif de l’animal vivant', () => {
  it('se garde à côté du prix de l’animal et se retire quand on le vide', async () => {
    const archive = await lireArchiveStock();
    const vivant = articlesDuGenre(GENRE_ARTICLE.VIANDE, archive).find((a) => roleDeLaViande(a.cle) === ROLE_VIANDE.VIVANT);
    expect(vivant).toBeDefined();
    await definirPrixArticle(vivant!.cle, 120);
    await definirPrixVifArticle(vivant!.cle, 4.5);
    const ligne = articlesDuGenre(GENRE_ARTICLE.VIANDE, await lireArchiveStock()).find((a) => a.cle === vivant!.cle);
    expect(ligne).toMatchObject({ prix: 120, prixVif: 4.5 });
    await definirPrixVifArticle(vivant!.cle, undefined);
    const apres = articlesDuGenre(GENRE_ARTICLE.VIANDE, await lireArchiveStock()).find((a) => a.cle === vivant!.cle);
    expect(apres?.prixVif).toBeUndefined();
    expect(apres?.prix).toBe(120);
  });
});

describe('quels articles changent de compte', () => {
  it('les fournitures et le matériel toujours ; les produits d’office, les boucles et les emballages de départ jamais', async () => {
    const archive = await lireArchiveStock();
    const dOffice = (genre: (typeof GENRE_ARTICLE)[keyof typeof GENRE_ARTICLE]) => articlesDuGenre(genre, archive)[0]?.cle;
    expect(peutChangerDeCompte(archive, dOffice(GENRE_ARTICLE.ALIMENT)!)).toBe(true);
    expect(peutChangerDeCompte(archive, dOffice(GENRE_ARTICLE.MATERIEL)!)).toBe(true);
    expect(peutChangerDeCompte(archive, dOffice(GENRE_ARTICLE.FROMAGE)!)).toBe(false);
    expect(peutChangerDeCompte(archive, dOffice(GENRE_ARTICLE.VIANDE)!)).toBe(false);
    expect(peutChangerDeCompte(archive, dOffice(GENRE_ARTICLE.EMBALLAGE)!)).toBe(false);
    expect(peutChangerDeCompte(archive, dOffice(GENRE_ARTICLE.BOUCLE)!)).toBe(false);
  });

  it('un produit ou un emballage ajouté change de compte tant qu’aucun lot ni conditionnement ne s’y rattache', async () => {
    const fromage = await ajouterArticle(GENRE_ARTICLE.FROMAGE, 'Tomme des cimes');
    const emballage = await ajouterArticle(GENRE_ARTICLE.EMBALLAGE, 'Sachet');
    let archive = await lireArchiveStock();
    expect(peutChangerDeCompte(archive, fromage)).toBe(true);
    expect(peutChangerDeCompte(archive, emballage)).toBe(true);
    archive = {
      ...archive,
      lots: [{ id: 'l1', article: fromage, numero: 'FT26001-1', dateFabrication: '2026-10-01' }],
      conditionnements: { frais: [emballage.split(':')[1]] },
    };
    expect(peutChangerDeCompte(archive, fromage)).toBe(false);
    expect(peutChangerDeCompte(archive, emballage)).toBe(false);
  });
});
