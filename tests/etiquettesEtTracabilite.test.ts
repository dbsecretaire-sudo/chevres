import { beforeAll, describe, expect, it } from 'vitest';
import type { Client } from '@/features/clients/types';
import type { Vente } from '@/features/comptabilite/types';
import { etiquettesHtml } from '@/features/export/etiquettesLotPdf';
import { tracabiliteHtml } from '@/features/export/tracabiliteLotPdf';
import { ingredientsEnManque } from '@/features/production/services/ingredientsPlat';
import { lireArchiveStock } from '@/features/stock/repository';
import { ajouterArticle } from '@/features/stock/services/stock';
import { etiquetteDuLot } from '@/features/stock/services/etiquetteLot';
import { tracabiliteDuLot } from '@/features/stock/services/tracabiliteLot';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { ETAT_LOT, GENRE_ARTICLE } from '@/shared/constants/stock';

const lot = (extra: Partial<LotFromage> & Pick<LotFromage, 'id' | 'article' | 'numero'>): LotFromage => ({
  dateFabrication: '2026-05-01',
  ...extra,
});

let archive: ArchiveStock;

beforeAll(async () => {
  const savon = await ajouterArticle(GENRE_ARTICLE.SAVON, 'Savon au lait de chèvre');
  const plat = await ajouterArticle(GENRE_ARTICLE.PLAT, 'Civet');
  const frais = await ajouterArticle(GENRE_ARTICLE.FROMAGE, 'Frais');
  const porc = await ajouterArticle(GENRE_ARTICLE.VIANDE, 'Porc');
  const tomme = await ajouterArticle(GENRE_ARTICLE.FROMAGE, 'Tomme');
  const base = await lireArchiveStock();
  archive = {
    ...base,
    lots: [
      lot({ id: 'f1', article: frais, numero: 'FF2612-1' }),
      lot({ id: 's1', article: savon, numero: 'SC26121-1', mouvementId: 'm-savon' }),
      lot({
        id: 's2',
        article: savon,
        numero: 'SC26121-2',
        mouvementId: 'm-savon',
        venteId: 'v1',
        dateVente: '2026-07-01',
      }),
      lot({ id: 'p1', article: plat, numero: 'PC26130-1', mouvementId: 'm-plat' }),
      lot({
        id: 'p2',
        article: plat,
        numero: 'PC26130-2',
        mouvementId: 'm-plat',
        reservation: { client: 'Jean Dupont', date: '2026-06-01' },
      }),
    ],
    dossiersSavons: { [savon]: { inci: 'Sodium Goatsmilkate, Olea Europaea Oil', etapes: {} } },
    platsFabriques: {
      'm-savon': {
        ddm: '2028-05-01',
        finCure: '2026-06-15',
        ingredients: [
          { article: tomme, quantite: 0.7, lotIds: [] },
          { article: porc, quantite: 5, lotIds: [] },
        ],
      },
      'm-plat': {
        ddm: '2028-01-01',
        ingredients: [{ article: frais, quantite: 2, lotIds: ['f1'] }],
      },
    },
  };
});

const vente = { id: 'v1', date: '2026-07-01', numeroFacture: 'F-12', client: 'Martin Marie' } as unknown as Vente;
const marie = {
  id: 'c1',
  nom: 'Martin',
  prenom: 'Marie',
  telephone: '0612345678',
  email: 'marie@example.org',
  adressePostale: '1 rue des Chèvres',
} as unknown as Client;

describe('étiquette d’un lot', () => {
  it('un savon porte sa liste INCI, sa durabilité et sa fin de cure', () => {
    const e = etiquetteDuLot(archive.lots![1], archive);
    expect(e).toMatchObject({
      produit: 'Savon au lait de chèvre',
      numero: 'SC26121-1',
      savon: true,
      ddm: '2028-05-01',
      finCure: '2026-06-15',
      composition: 'Sodium Goatsmilkate, Olea Europaea Oil',
    });
  });

  it('un plat liste ses ingrédients, sans INCI', () => {
    const e = etiquetteDuLot(archive.lots![3], archive);
    expect(e.savon).toBe(false);
    expect(e.composition).toBe('Frais');
    expect(e.finCure).toBeUndefined();
  });

  it('sans INCI, un savon retombe sur les ingrédients de sa fabrication, du plus gros au plus petit', () => {
    const sans = { ...archive, dossiersSavons: {} } as ArchiveStock;
    expect(etiquetteDuLot(sans.lots![1], sans).composition).toBe('Porc, Tomme');
  });
});

describe('traçabilité d’un lot', () => {
  it('donne les lots pris pour les ingrédients, la destination des lots de la fabrication et le contact du client', () => {
    const t = tracabiliteDuLot(archive.lots![1], archive, new Map([['v1', vente]]), [marie]);
    expect(t.lotsDeLaFabrication.map((d) => d.numero)).toEqual(['SC26121-1', 'SC26121-2']);
    expect(t.lotsDeLaFabrication[0].etat).toBe(ETAT_LOT.EN_STOCK);
    expect(t.lotsDeLaFabrication[1]).toMatchObject({
      etat: ETAT_LOT.VENDU,
      numeroFacture: 'F-12',
      client: 'Martin Marie',
      telephone: '0612345678',
      adresse: '1 rue des Chèvres',
    });
    const plat = tracabiliteDuLot(archive.lots![3], archive, new Map(), []);
    expect(plat.ingredients).toEqual([{ libelle: 'Frais', quantite: 2, numeros: ['FF2612-1'] }]);
  });

  it('un lot de fromage utilisé dans un plat remonte les lots du plat, avec le client de la réservation', () => {
    const t = tracabiliteDuLot(archive.lots![0], archive, new Map(), []);
    expect(t.produitsDerives.map((d) => d.numero)).toEqual(['PC26130-1', 'PC26130-2']);
    expect(t.produitsDerives[1]).toMatchObject({ reserve: true, client: 'Jean Dupont' });
  });

  it('un lot sans fabrication suivie n’a ni ingrédient ni autre lot', () => {
    const t = tracabiliteDuLot(archive.lots![0], archive, new Map(), []);
    expect(t.ingredients).toEqual([]);
    expect(t.lotsDeLaFabrication).toHaveLength(1);
  });
});

describe('stock insuffisant à la fabrication', () => {
  it('liste les ingrédients que le stock ne couvre pas, en additionnant un même article cité deux fois', () => {
    const [frais] = archive.lots!.map((l) => l.article);
    const avecStock = {
      ...archive,
      mouvements: [{ id: 'm1', article: frais, delta: 3, date: '2026-05-01' }],
    } as unknown as ArchiveStock;
    expect(ingredientsEnManque(avecStock, [{ article: frais, quantite: 2 }])).toEqual([]);
    expect(
      ingredientsEnManque(avecStock, [
        { article: frais, quantite: 2 },
        { article: frais, quantite: 1.5 },
      ]),
    ).toEqual([{ libelle: 'Frais', enStock: 3, demande: 3.5 }]);
  });

  it('un article sans aucun mouvement compte pour zéro', () => {
    const [, savon] = archive.lots!.map((l) => l.article);
    expect(ingredientsEnManque(archive, [{ article: savon, quantite: 1 }])).toEqual([
      { libelle: 'Savon au lait de chèvre', enStock: 0, demande: 1 },
    ]);
  });
});

describe('documents imprimés', () => {
  it('l’étiquette d’un savon porte le lot, l’INCI, la durabilité, le contenu net et le responsable', () => {
    const html = etiquettesHtml(
      archive.lots!.slice(1, 3).map((l) => etiquetteDuLot(l, archive)),
      { nomExploitant: 'Joseph Riolacci', adresseExploitant: 'Pianello' } as never,
      '100 g',
    );
    expect(html).toContain('Lot SC26121-1');
    expect(html).toContain('Sodium Goatsmilkate, Olea Europaea Oil');
    expect(html).toContain('À utiliser de préférence avant 01/05/2028');
    expect(html).toContain('Contenu net : 100 g');
    expect(html).toContain('Joseph Riolacci, Pianello');
    expect(html.match(/class="etiquette"/g)).toHaveLength(2);
  });

  it('sans responsable renseigné, l’étiquette le signale', () => {
    const html = etiquettesHtml([etiquetteDuLot(archive.lots![3], archive)], undefined);
    expect(html).toContain('à renseigner dans les informations de l’exploitation');
    expect(html).toContain('Ingrédients :');
  });

  it('la fiche de traçabilité montre ingrédients, lots, client et produits dérivés', () => {
    const lotsDeFrais = tracabiliteHtml(
      tracabiliteDuLot(archive.lots![0], archive, new Map(), []),
    );
    expect(lotsDeFrais).toContain('PC26130-1');
    expect(lotsDeFrais).toContain('Réservé pour Jean Dupont');
    const savon = tracabiliteHtml(tracabiliteDuLot(archive.lots![2], archive, new Map([['v1', vente]]), [marie]));
    expect(savon).toContain('F-12');
    expect(savon).toContain('Martin Marie');
    expect(savon).toContain('0612345678');
    expect(savon).toContain('Aucun produit n’a été fait avec ces lots.');
  });
});
