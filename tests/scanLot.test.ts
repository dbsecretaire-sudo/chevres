import { describe, expect, it } from 'vitest';
import { formaterNumeroDeLot, lettresDesNumeros, lotsDuNumero } from '@/features/production/simple/lotsDuNumero';
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

describe('le numéro de lot tapé sur le clavier', () => {
  const numeros = ['FF26297-15', 'FF26297-16', 'BV26120-2'];

  it('le « - » se place tout seul là où les lots connus l’ont', () => {
    expect(formaterNumeroDeLot('FF26297', numeros)).toBe('FF26297');
    expect(formaterNumeroDeLot('FF262971', numeros)).toBe('FF26297-1');
    expect(formaterNumeroDeLot('FF2629716', numeros)).toBe('FF26297-16');
    expect(formaterNumeroDeLot('BV261202', numeros)).toBe('BV26120-2');
  });

  it('sans lot connu, il se place après le jour de l’année (les lettres, 2 chiffres d’année, 3 de jour)', () => {
    expect(formaterNumeroDeLot('PF2630012', [])).toBe('PF26300-12');
    expect(formaterNumeroDeLot('FFNSC2629716', [])).toBe('FFNSC26297-16');
    expect(formaterNumeroDeLot('', numeros)).toBe('');
  });

  it('le clavier propose les lettres des produits et celles des numéros déjà donnés', () => {
    expect(lettresDesNumeros(numeros)).toEqual(['B', 'C', 'F', 'N', 'P', 'S', 'U', 'V']);
    expect(lettresDesNumeros(['XZ12-1'])).toContain('X');
  });
});
