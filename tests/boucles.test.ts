import { describe, expect, it } from 'vitest';
import type { Chevre } from '@/features/cheptel/types';
import {
  avecPoses,
  avecRemarque,
  bouclesApresAchat,
  bouclesSelonLeCheptel,
  derniereBoucle,
  lignesDeRemplacement,
  nePasPoser,
  numeroDejaEnStock,
  plageDeBoucles,
  texteDeLaSortie,
} from '@/features/stock/services/boucles';
import type { ArchiveStock, BoucleStock } from '@/features/stock/types';
import { ARTICLE_BOUCLE, GENRE_ARTICLE } from '@/shared/constants/stock';

const BOUCLES = `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.BOUCLES}`;

const boucle = (numero: string, plus: Partial<BoucleStock> = {}): BoucleStock => ({
  id: `b${numero}`,
  article: BOUCLES,
  numero,
  ...plus,
});

const chevre = (id: string, numeroBoucle: string, dateBouclage?: string): Chevre =>
  ({ id, numeroBoucle, dateBouclage }) as unknown as Chevre;

describe('plage de boucles', () => {
  it('numérote à la suite, en gardant les zéros du début', () => {
    expect(plageDeBoucles('30011', 3)).toEqual(['30011', '30012', '30013']);
    expect(plageDeBoucles('FR0098', 3)).toEqual(['FR0098', 'FR0099', 'FR0100']);
    expect(derniereBoucle('100', 5)).toBe('104');
  });

  it('refuse un premier numéro sans chiffre final ou une quantité nulle', () => {
    expect(plageDeBoucles('abc', 3)).toBeUndefined();
    expect(plageDeBoucles('100', 0)).toBeUndefined();
  });
});

describe('achat de boucles', () => {
  const facture = {
    id: 'f1',
    date: '2026-01-10',
    montant: 50,
    stockArticle: BOUCLES,
    stockQuantite: 3,
    bouclesDebut: '200',
    activite: undefined,
    categorieDepense: undefined,
  } as never;

  it('crée une boucle par numéro de la plage, liée à sa facture', () => {
    const resultat = bouclesApresAchat([], facture);
    expect(resultat.map((b) => b.numero)).toEqual(['200', '201', '202']);
    expect(resultat.every((b) => b.factureId === 'f1' && b.dateAchat === '2026-01-10')).toBe(true);
  });

  it('garde la pose d’une boucle quand on réenregistre la facture', () => {
    const avant = bouclesApresAchat([], facture);
    const posee = avant.map((b) => (b.numero === '201' ? { ...b, chevreId: 'c1', datePose: '2026-02-01' } : b));
    const apres = bouclesApresAchat(posee, facture);
    expect(apres.find((b) => b.numero === '201')?.chevreId).toBe('c1');
    expect(apres).toHaveLength(3);
  });

  it('refuse un numéro déjà acheté sur une autre facture', () => {
    const archive: Pick<ArchiveStock, 'boucles'> = { boucles: [boucle('201', { factureId: 'autre' })] };
    expect(numeroDejaEnStock(archive, ['200', '201'], 'f1', BOUCLES)).toBe('201');
    expect(numeroDejaEnStock(archive, ['200', '201'], 'autre', BOUCLES)).toBeUndefined();
  });
});

describe('boucles et cheptel', () => {
  it('une boucle est posée quand un animal porte son numéro, avec sa date de bouclage', () => {
    const resultat = bouclesSelonLeCheptel(
      [boucle('450'), boucle('462')],
      [chevre('c1', '462', '2020-04-01')],
    );
    const posee = resultat.find((b) => b.numero === '462');
    expect(posee?.chevreId).toBe('c1');
    expect(posee?.datePose).toBe('2020-04-01');
    expect(resultat.find((b) => b.numero === '450')?.chevreId).toBeUndefined();
  });

  it('une boucle jamais commandée n’existe que tant qu’un animal la porte', () => {
    const sansAchat = boucle('900', { depuisCheptel: true });
    expect(bouclesSelonLeCheptel([sansAchat], [])).toEqual([]);
    expect(bouclesSelonLeCheptel([sansAchat], [chevre('c9', '900')])).toHaveLength(1);
  });

  it('avecPoses remet « à poser » une boucle quand son animal n’est plus au cheptel', () => {
    const archive: ArchiveStock = {
      boucles: [boucle('462', { chevreId: 'c1', datePose: '2020-04-01', factureId: 'f1', dateAchat: '2020-01-01' })],
      mouvements: [],
    } as unknown as ArchiveStock;
    const resultat = avecPoses(archive, []);
    expect(resultat.boucles?.[0].chevreId).toBeUndefined();
    expect(resultat.boucles?.[0].datePose).toBeUndefined();
  });

  it('avecPoses ajoute une boucle d’animal absente de l’inventaire, et la retire avec lui', () => {
    const archive = { boucles: [], mouvements: [] } as unknown as ArchiveStock;
    const animal = chevre('c5', '777', '2024-05-05');
    const avec = avecPoses(archive, [animal], [animal]);
    expect(avec.boucles?.map((b) => b.numero)).toEqual(['777']);
    expect(avec.boucles?.[0].depuisCheptel).toBe(true);
    // L'animal parti, la boucle ajoutée depuis sa fiche disparaît avec lui.
    expect(avecPoses(avec, []).boucles).toEqual([]);
  });
});

describe('remarque sur des boucles', () => {
  it('marque seulement la plage demandée, dans un sens ou dans l’autre', () => {
    const boucles = [boucle('10'), boucle('11'), boucle('12'), boucle('13')];
    const { boucles: marquees, nombre } = avecRemarque(boucles, BOUCLES, '12', '11', 'commandées en trop');
    expect(nombre).toBe(2);
    expect(marquees.filter((b) => b.remarque).map((b) => b.numero)).toEqual(['11', '12']);
  });

  it('une remarque vide la retire', () => {
    const { boucles } = avecRemarque([boucle('10', { remarque: 'x' })], BOUCLES, '10', '10', undefined);
    expect(boucles[0].remarque).toBeUndefined();
  });

  it('« ne pas poser » : remarque sans animal ni date de pose', () => {
    expect(nePasPoser({ remarque: 'jamais posées' })).toBe(true);
    expect(nePasPoser({ remarque: 'jamais posées', chevreId: 'c1' })).toBe(false);
    expect(nePasPoser({})).toBe(false);
  });
});

describe('sortie d’un animal sur l’impression des boucles', () => {
  it('écrit la cause et la date : abattoir, auto-consommation, mort-né, vente', () => {
    expect(texteDeLaSortie('abattoir', '2026-03-12')).toMatch(/^Abattoir le /);
    expect(texteDeLaSortie('autoconsommee', '2026-03-12')).toMatch(/^Auto-consommation le /);
    expect(texteDeLaSortie('mortne', '2026-03-12')).toMatch(/^Mort-né le /);
    expect(texteDeLaSortie('vendue', '2026-03-12')).toMatch(/^Vendue le /);
  });

  it('une mort classique (transhumance) renvoie au bordereau de perte', () => {
    expect(texteDeLaSortie('morte', '2026-03-12')).toMatch(/, voir bordereau de perte$/);
    expect(texteDeLaSortie('morte', undefined)).toBe('Voir bordereau de perte');
  });

  it('sans date, la cause seule ; rien pour un animal vivant', () => {
    expect(texteDeLaSortie('abattoir', undefined)).toBe('Abattoir');
    expect(texteDeLaSortie('vivante', '2026-03-12')).toBe('');
  });
});

describe('boucles de remplacement (rouges, rebouclage)', () => {
  const ROUGES = 'boucle:rouges';
  const mouvement = (id: string, date: string, delta: number) =>
    ({ id, article: ROUGES, date, delta, origine: 'achat' }) as never;

  it('une ligne par boucle achetée : les poses d’abord, puis les lignes vides en stock', () => {
    const posees = [
      boucle('00462', { id: 'p1', article: ROUGES, chevreId: 'c1', datePose: '2024-12-10' }),
      boucle('70039', { id: 'p2', article: ROUGES, chevreId: 'c2', datePose: '2025-01-05' }),
    ];
    const lignes = lignesDeRemplacement(
      ROUGES,
      posees,
      [mouvement('a', '2024-06-01', 10), mouvement('pose1', '2024-12-10', -1), mouvement('pose2', '2025-01-05', -1)],
    );
    expect(lignes).toHaveLength(10);
    expect(lignes.slice(0, 2).map((b) => b.numero)).toEqual(['00462', '70039']);
    const libres = lignes.slice(2);
    expect(libres).toHaveLength(8);
    expect(libres.every((b) => b.numero === '' && !b.chevreId)).toBe(true);
    expect(new Set(libres.map((b) => b.id)).size).toBe(8);
  });

  it('chaque ligne a la date d’achat de sa boucle : les plus anciennes sont posées en premier', () => {
    const lignes = lignesDeRemplacement(
      ROUGES,
      [boucle('1', { id: 'p', article: ROUGES, chevreId: 'c', datePose: '2025-01-05' })],
      [mouvement('a', '2024-01-01', 1), mouvement('b', '2025-02-01', 2), mouvement('pose', '2025-01-05', -1)],
    );
    expect(lignes.map((b) => b.dateAchat)).toEqual(['2024-01-01', '2025-02-01', '2025-02-01']);
  });

  it('rien en stock : seulement les poses ; un niveau négatif n’ajoute aucune ligne', () => {
    expect(lignesDeRemplacement(ROUGES, [], [])).toEqual([]);
    expect(lignesDeRemplacement(ROUGES, [], [mouvement('a', '2025-01-01', 1), mouvement('b', '2025-01-02', -3)])).toEqual([]);
  });
});
