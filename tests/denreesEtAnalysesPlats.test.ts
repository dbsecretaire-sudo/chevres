import { describe, expect, it } from 'vitest';
import { articlesDeBesoin } from '@/features/commercial/services/stockVisite';
import { ingredientsProposables } from '@/features/production/services/ingredientsPlat';
import { lireArchiveStock, normaliserArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import { rappelsAnalysesPlats } from '@/features/stock/services/analysesPlats';
import { ID_LISTE_DENREES } from '@/features/stock/services/denrees';
import { enregistrerAnalyseDePlats, fabriquerPlats } from '@/features/stock/services/lots';
import { ajouterArticle } from '@/features/stock/services/stock';
import { GENRE_ARTICLE } from '@/shared/constants/stock';

const groupes = { fromages: 'Fromages', charcuterie: 'Charcuterie', plats: 'Plats', autres: 'Autres' };

describe('matières alimentaires consommables', () => {
  it("l'inventaire a d'office sa liste (compte 601400), avec farine, œufs et huile d'olive", async () => {
    const archive = await lireArchiveStock();
    const liste = archive.listes?.find((l) => l.id === ID_LISTE_DENREES);
    expect(liste?.compte).toBe('601400');
    const noms = archive.articles.filter((a) => a.listeId === ID_LISTE_DENREES).map((a) => a.nom);
    expect(noms).toEqual(expect.arrayContaining(['Farine', 'Œufs', 'Huile d’olive']));
  });

  it('une liste supprimée ne revient pas, et ne se double pas à la lecture suivante', async () => {
    const archive = await lireArchiveStock();
    await remplacerArchiveStock({ ...archive, listes: [], articles: [] });
    const relue = await lireArchiveStock();
    expect(relue.listes).toEqual([]);
    expect(relue.denreesAjoutees).toBe(true);
    await remplacerArchiveStock({ ...archive });
    const encore = await lireArchiveStock();
    expect(encore.listes?.filter((l) => l.id === ID_LISTE_DENREES)).toHaveLength(1);
  });

  it('les formules proposent les plats et les matières alimentaires, rangées sous le nom de leur liste', async () => {
    await ajouterArticle(GENRE_ARTICLE.PLAT, 'Soupe de légumes');
    const archive = await lireArchiveStock();
    const propose = articlesDeBesoin(archive, groupes);
    expect(propose.find((a) => a.libelle === 'Soupe de légumes')?.groupe).toBe('Plats');
    const farine = propose.find((a) => a.libelle === 'Farine');
    expect(farine?.groupe).toMatch(/Matières alimentaires consommables/);
    expect(ingredientsProposables(archive, groupes).find((a) => a.libelle === 'Farine')?.groupe).toMatch(
      /Matières alimentaires/,
    );
  });
});

describe('analyses des plats préparés en stock', () => {
  const lot = (id: string, mouvementId: string, extra = {}) => ({
    id,
    article: 'plat:civet',
    numero: `PC26${id}-1`,
    dateFabrication: '2026-01-10',
    mouvementId,
    ...extra,
  });
  const archive = normaliserArchiveStock({
    lots: [
      lot('a', 'm1'),
      lot('b', 'm1', { dateVente: '2026-02-01' }),
      lot('c', 'm2', { dateRappel: '2026-02-02' }),
    ],
    platsFabriques: { m1: { dateSterilisation: '2026-01-12', ingredients: [] } },
    articles: [{ id: 'civet', genre: GENRE_ARTICLE.PLAT, nom: 'Civet' }],
    noms: {},
    listes: [],
  });

  it('sans intervalle réglé, aucun rappel', () => {
    expect(rappelsAnalysesPlats(archive, undefined, '2026-12-01')).toEqual([]);
  });

  it("rappelle une fabrication dont il reste des lots en stock, à l'échéance (sept jours avant, en retard après)", () => {
    expect(rappelsAnalysesPlats(archive, 90, '2026-04-01')).toEqual([]);
    const proche = rappelsAnalysesPlats(archive, 90, '2026-04-05');
    expect(proche).toHaveLength(1);
    expect(proche[0]).toMatchObject({ echeance: '2026-04-12', enRetard: false, fabricationId: 'm1' });
    const retard = rappelsAnalysesPlats(archive, 90, '2026-05-01');
    expect(retard[0].enRetard).toBe(true);
    // Le lot vendu et le lot rappelé ne comptent pas : m2 n'a plus rien en stock.
    expect(retard.map((r) => r.fabricationId)).toEqual(['m1']);
  });

  it("noter l'envoi d'un échantillon repousse l'analyse suivante d'un intervalle", async () => {
    await enregistrerAnalyseDePlats('m1', '2026-04-20');
    const relue = await lireArchiveStock();
    expect(relue.platsFabriques?.m1.analyses).toEqual(['2026-04-20']);
    const apres = rappelsAnalysesPlats(
      { ...archive, platsFabriques: relue.platsFabriques },
      90,
      '2026-05-01',
    );
    expect(apres).toEqual([]);
  });
});
