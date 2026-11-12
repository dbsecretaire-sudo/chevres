import { describe, expect, it } from 'vitest';
import { lireArchiveStock } from '@/features/stock/repository';
import { fabriquerFromages, numeroDeLot } from '@/features/stock/services/lots';

describe('numéro de lot : un identifiant incrémenté, en chiffres seuls', () => {
  it('sans aucun lot, le premier numéro est 1', () => {
    expect(numeroDeLot({ lots: [] })).toBe('1');
  });

  it('le suivant du plus grand numéro déjà pris, en ignorant les anciens numéros FF', () => {
    const lots = [
      { id: 'a', article: 'fromage:frais', numero: '651', dateFabrication: '2026-10-28' },
      { id: 'b', article: 'fromage:frais', numero: 'FF26297-16', dateFabrication: '2026-05-01' },
      { id: 'c', article: 'fromage:vieux', numero: '650', dateFabrication: '2026-10-27' },
    ];
    expect(numeroDeLot({ lots })).toBe('652');
  });

  it('une fabrication de plusieurs fromages prend des numéros à la suite, et la suivante continue', async () => {
    await fabriquerFromages({ article: 'fromage:frais', date: '2026-10-30', quantite: 3, debut: '652' });
    const archive = await lireArchiveStock();
    expect(archive.lots?.map((l) => l.numero)).toEqual(expect.arrayContaining(['652', '653', '654']));
    expect(numeroDeLot(archive)).toBe('655');
  });
});
