import { describe, expect, it } from 'vitest';
import { avecRemisesAZero } from '@/features/stock/services/remisesAZero';
import { mouvementsDuLait } from '@/features/stock/services/historiqueLait';
import { bilanLait } from '@/features/stock/services/stock';
import type { ArchiveStock, MouvementStock } from '@/features/stock/types';
import { ORIGINE_MOUVEMENT } from '@/shared/constants/stock';

const achat = (id: string, date: string, delta: number): MouvementStock => ({
  id,
  article: 'aliment:mais',
  date,
  delta,
  origine: ORIGINE_MOUVEMENT.ACHAT,
});

describe('la remise à zéro automatique des aliments', () => {
  const mouvements = [achat('a1', '2026-01-10', 100), achat('a2', '2026-03-10', 50), achat('a3', '2026-06-10', 20)];

  it('remet l’aliment à zéro à chaque nouvel achat', () => {
    const remises = avecRemisesAZero(mouvements).filter((m) => m.automatique);
    expect(remises.map((m) => m.date)).toEqual(['2026-03-10', '2026-06-10']);
  });

  it('désactivée à une date, ne remet plus à zéro à partir de ce jour : celles d’avant restent', () => {
    const remises = avecRemisesAZero(mouvements, '2026-05-01').filter((m) => m.automatique);
    expect(remises.map((m) => m.date)).toEqual(['2026-03-10']);
  });
});

describe('la balance automatique du lait', () => {
  const archive = (sansAutomatique?: ArchiveStock['sansAutomatique']): Pick<ArchiveStock, 'mouvements' | 'lait' | 'sansAutomatique'> => ({
    mouvements: [],
    lait: [{ id: 'l1', date: '2026-01-05', litres: 100 }],
    sansAutomatique,
  });
  const ventes = [
    { id: 'v1', date: '2026-02-01', litres: 150 },
    { id: 'v2', date: '2026-07-01', litres: 80 },
  ];

  it('ajoute au lait produit ce qui est sorti sans être noté', () => {
    const balance = mouvementsDuLait(archive(), ventes).filter((m) => m.origine === ORIGINE_MOUVEMENT.BALANCE);
    expect(balance.map((m) => [m.date, m.delta])).toEqual([
      ['2026-02-01', 50],
      ['2026-07-01', 80],
    ]);
  });

  it('désactivée à une date, garde ce qui avait été ajouté avant et n’ajoute plus ensuite', () => {
    const balance = mouvementsDuLait(archive({ lait: '2026-05-01' }), ventes).filter(
      (m) => m.origine === ORIGINE_MOUVEMENT.BALANCE,
    );
    expect(balance.map((m) => [m.date, m.delta])).toEqual([['2026-02-01', 50]]);
  });

  it('le bilan suit : produit = noté + ce qui a été ajouté avant la désactivation', () => {
    const complet = { ...archive(), mouvements: [], articles: [], conditionnements: {}, ordres: {}, noms: {}, prix: {} } as ArchiveStock;
    expect(bilanLait(complet, 230, ventes).produit).toBe(230);
    const arrete = { ...complet, sansAutomatique: { lait: '2026-05-01' } };
    expect(bilanLait(arrete, 230, ventes).produit).toBe(150);
  });
});
