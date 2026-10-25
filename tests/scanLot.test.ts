import { describe, expect, it } from 'vitest';
import { lotsDuNumero } from '@/features/production/simple/lotsDuNumero';
import type { LotFromage } from '@/features/stock/types';

const lot = (id: string, numero: string): LotFromage => ({ id, article: 'fromage:frais', numero, dateFabrication: '2026-10-24' });
const lots = [lot('a', 'FF26297-15'), lot('b', 'FF26297-16'), lot('c', 'FF26298-16')];

describe('retrouver un lot d’après le numéro lu ou tapé', () => {
  it('le numéro exact, sans tenir compte des majuscules, espaces ni tirets', () => {
    expect(lotsDuNumero(lots, 'ff26297-16').map((l) => l.id)).toEqual(['b']);
    expect(lotsDuNumero(lots, 'FF26297 15').map((l) => l.id)).toEqual(['a']);
  });

  it('un numéro partiel (la fin du numéro) peut désigner plusieurs lots', () => {
    expect(lotsDuNumero(lots, '16').map((l) => l.id)).toEqual(['b', 'c']);
  });

  it('rien quand le numéro est vide ou inconnu', () => {
    expect(lotsDuNumero(lots, '  ')).toEqual([]);
    expect(lotsDuNumero(lots, 'XX1')).toEqual([]);
  });
});
