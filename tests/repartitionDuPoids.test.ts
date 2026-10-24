import { describe, expect, it } from 'vitest';
import { repartirLePoids } from '@/features/production/simple/repartitionDuPoids';
import type { Chevre } from '@/features/cheptel/types';

const animal = (id: string, poidsKg?: number) => ({ id, poidsKg }) as Chevre;

describe('le poids total d’un jour d’abattage', () => {
  it('se répartit à parts égales quand aucun poids n’est connu', () => {
    const r = repartirLePoids([animal('a'), animal('b'), animal('c')], 30);
    expect(r.map((a) => a.poidsKg)).toEqual([10, 10, 10]);
  });

  it('garde les proportions des poids connus', () => {
    const r = repartirLePoids([animal('a', 6), animal('b', 12)], 36);
    expect(r.map((a) => a.poidsKg)).toEqual([12, 24]);
    expect(r.reduce((t, a) => t + (a.poidsKg ?? 0), 0)).toBe(36);
  });

  it('un seul animal reçoit tout le poids', () => {
    expect(repartirLePoids([animal('a', 8)], 9.5)[0].poidsKg).toBe(9.5);
  });
});
