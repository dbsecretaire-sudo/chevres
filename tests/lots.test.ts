import { describe, expect, it } from 'vitest';
import {
  animauxDuLot,
  bouclesDuLot,
  lotDuTraitement,
  nomDeLotPris,
  traitementsDuLot,
} from '@/features/lots-animaux/services/lots';
import type { Chevre } from '@/features/cheptel/types';
import type { Traitement } from '@/features/sante/types';

const lot = { id: 'l1', nom: 'Chevrettes 2026', boucles: '10001, 10002 ,10003' };
const animal = (b: string | undefined): Chevre => ({ id: b ?? 'x', numeroBoucle: b }) as unknown as Chevre;
const traitement = (id: string, extra: Partial<Traitement> = {}): Traitement => ({ id, date: '2026-03-01', produit: 'P', ...extra });

describe('lots d’animaux', () => {
  it('les boucles d’un lot, nettoyées', () => {
    expect(bouclesDuLot(lot)).toEqual(['10001', '10002', '10003']);
    expect(bouclesDuLot({ boucles: '' })).toEqual([]);
  });

  it('les animaux du lot sont ceux dont la boucle y figure', () => {
    const animaux = [animal('10001'), animal('10009'), animal(undefined), animal('10003')];
    expect(animauxDuLot(lot, animaux).map((a) => a.numeroBoucle)).toEqual(['10001', '10003']);
  });

  it('les traitements d’un lot : ceux qui lui sont rattachés, le plus récent d’abord', () => {
    const t = [
      traitement('a', { lotId: 'l1', date: '2026-01-10' }),
      traitement('b', { lotId: 'l2' }),
      traitement('c', { lotId: 'l1', date: '2026-04-02', dateFin: '2026-04-05' }),
      traitement('d'),
    ];
    expect(traitementsDuLot(lot, t).map((x) => x.id)).toEqual(['c', 'a']);
  });

  it('le lot d’un traitement, tant qu’il existe', () => {
    expect(lotDuTraitement({ lotId: 'l1' }, [lot])?.nom).toBe('Chevrettes 2026');
    expect(lotDuTraitement({ lotId: 'supprime' }, [lot])).toBeUndefined();
    expect(lotDuTraitement({}, [lot])).toBeUndefined();
  });

  it('deux lots n’ont pas le même nom (casse et espaces ignorés), sauf lui-même', () => {
    expect(nomDeLotPris('  chevrettes 2026 ', [lot])).toBe(true);
    expect(nomDeLotPris('chevrettes 2026', [lot], 'l1')).toBe(false);
    expect(nomDeLotPris('Boucs', [lot])).toBe(false);
  });
});
