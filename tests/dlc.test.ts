import { describe, expect, it } from 'vitest';
import { dlcDuLot, dureeDeVieDuLot, dureesDeVieDeLArticle, suffixeDeVariante, VARIANTES_DE_FROMAGE, variantesImposees, variantesPossibles } from '@/features/stock/services/dlc';
import { definirDureesDeVie } from '@/features/stock/services/stock';
import { lireArchiveStock } from '@/features/stock/repository';

const lot = { article: 'fromage:frais', dateFabrication: '2026-10-24' };

describe('la DLC d’un fromage selon le sel et le lait', () => {
  const archive = {
    dureeDeVie: { 'fromage:frais': 5, 'fromage:frais|nonsale|cru': 7, 'fromage:frais|sale|uht': 30 },
  };

  it('la durée de la variante du lot est prise d’abord', () => {
    expect(dureeDeVieDuLot({ ...lot, sale: false, lait: 'cru' }, archive)).toBe(7);
    expect(dureeDeVieDuLot({ ...lot, sale: true, lait: 'uht' }, archive)).toBe(30);
  });

  it('sans durée pour sa variante, ou sans variante, le lot prend la durée de base', () => {
    expect(dureeDeVieDuLot({ ...lot, sale: true, lait: 'cru' }, archive)).toBe(5);
    expect(dureeDeVieDuLot(lot, archive)).toBe(5);
  });

  it('rien tant qu’aucune durée n’est réglée', () => {
    expect(dureeDeVieDuLot(lot, { dureeDeVie: undefined })).toBeUndefined();
    expect(dlcDuLot(lot, { dureeDeVie: {} })).toBeUndefined();
  });

  it('la DLC est la fabrication plus la durée', () => {
    expect(dlcDuLot({ ...lot, sale: false, lait: 'cru' }, archive)).toBe('2026-10-31');
    expect(dlcDuLot({ ...lot, sale: true, lait: 'uht' }, archive)).toBe('2026-11-23');
  });

  it('six variantes : trois laits, salés ou non', () => {
    expect(VARIANTES_DE_FROMAGE).toHaveLength(6);
    expect(suffixeDeVariante({ sale: true, lait: 'pasteurise' })).toBe('sale|pasteurise');
  });

  it('le vieux est toujours salé, le brocciu toujours salé et pasteurisé', () => {
    expect(variantesImposees('fromage:affine')).toEqual({ sale: true });
    expect(variantesImposees('fromage:brocciu')).toEqual({ sale: true, lait: 'pasteurise' });
    expect(variantesImposees('fromage:frais')).toEqual({});
    expect(variantesPossibles('fromage:affine')).toHaveLength(3);
    expect(variantesPossibles('fromage:brocciu')).toEqual([{ sale: true, lait: 'pasteurise' }]);
    expect(variantesPossibles('fromage:frais')).toHaveLength(6);
  });

  it('les durées d’un article se règlent d’un coup, par variante', async () => {
    await definirDureesDeVie('fromage:crottin', { '': 10, 'nonsale|cru': 14 });
    let archiveLue = await lireArchiveStock();
    expect(dureesDeVieDeLArticle(archiveLue, 'fromage:crottin')).toEqual({ '': 10, 'nonsale|cru': 14 });
    // Une nouvelle saisie remplace les anciennes durées de cet article, et touche aucun autre.
    await definirDureesDeVie('fromage:crottin', { 'sale|uht': 21 });
    archiveLue = await lireArchiveStock();
    expect(dureesDeVieDeLArticle(archiveLue, 'fromage:crottin')).toEqual({ 'sale|uht': 21 });
  });
});
