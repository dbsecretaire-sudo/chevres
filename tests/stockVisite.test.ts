import { describe, expect, it } from 'vitest';
import { besoinsDeLaVisite, choixParDefaut, choixValide, lotsPourVisite } from '@/features/commercial/services/stockVisite';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import { rendreStockDeVisite, utiliserStockPourVisite } from '@/features/stock/services/lots';
import { niveauxDeStock } from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { ORIGINE_MOUVEMENT } from '@/shared/constants/stock';

const lot = (id: string, numero: string, date: string, extra: Partial<LotFromage> = {}): LotFromage => ({
  id,
  article: 'fromage:frais',
  numero,
  dateFabrication: date,
  ...extra,
});

describe('stock nécessaire d’une formule d’agritourisme', () => {
  it('calcule le besoin d’une visite : par groupe ou par personne, les doublons s’additionnent', () => {
    const formule = {
      besoins: [
        { article: 'fromage:frais', quantite: 1 },
        { article: 'fromage:frais', quantite: 2, parPersonne: true },
        { article: 'viande:saucisson', quantite: 1, parPersonne: true },
        { article: 'fromage:tomme', quantite: 0 },
      ],
    };
    expect(besoinsDeLaVisite(formule, 10)).toEqual([
      { article: 'fromage:frais', quantite: 21 },
      { article: 'viande:saucisson', quantite: 10 },
    ]);
    expect(besoinsDeLaVisite(undefined, 10)).toEqual([]);
  });

  it('propose d’office les lots les plus anciens, sans en prendre plus que la quantité', () => {
    const archive = { lots: [lot('c', 'FF-3', '2026-10-21'), lot('a', 'FF-1', '2026-10-19'), lot('b', 'FF-2', '2026-10-20')] };
    expect(lotsPourVisite(archive, 'fromage:frais').map((l) => l.numero)).toEqual(['FF-1', 'FF-2', 'FF-3']);
    const choix = choixParDefaut([{ article: 'fromage:frais', quantite: 2 }], archive);
    expect(choix[0].lotIds).toEqual(['a', 'b']);
    expect(choixValide(choix)).toBe(true);
    expect(choixValide([{ article: 'fromage:frais', quantite: 1, lotIds: ['a', 'b'] }])).toBe(false);
  });

  it('sort les produits du stock à la visite et les rend quand elle est défaite', async () => {
    const base = (await lireArchiveStock()) as ArchiveStock;
    await remplacerArchiveStock({
      ...base,
      mouvements: [{ id: 'm0', article: 'fromage:frais', date: '2026-10-19', delta: 5, origine: ORIGINE_MOUVEMENT.MANUEL }],
      lots: [lot('a', 'FF-1', '2026-10-19'), lot('b', 'FF-2', '2026-10-20')],
    });
    await utiliserStockPourVisite('visite1', '2026-10-25', [{ article: 'fromage:frais', quantite: 3, lotIds: ['a'] }]);
    let archive = await lireArchiveStock();
    expect(niveauxDeStock(archive.mouvements).get('fromage:frais')).toBe(2);
    const a = archive.lots!.find((l) => l.id === 'a')!;
    expect(a.venteId).toBe('visite1');
    expect(a.dateVente).toBe('2026-10-25');
    expect(archive.lots!.find((l) => l.id === 'b')!.venteId).toBeUndefined();
    expect(archive.mouvements.some((m) => m.origine === ORIGINE_MOUVEMENT.VISITE)).toBe(true);

    await rendreStockDeVisite('visite1');
    archive = await lireArchiveStock();
    expect(niveauxDeStock(archive.mouvements).get('fromage:frais')).toBe(5);
    expect(archive.lots!.find((l) => l.id === 'a')!.venteId).toBeUndefined();
  });
});
