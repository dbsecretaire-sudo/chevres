import { describe, expect, it } from 'vitest';
import { lotsDAbattoir } from '@/features/exploitation/services/lots';
import type { Chevre } from '@/features/cheptel/types';
import type { LotAnimaux } from '@/features/settings/settings';

const animal = (numeroBoucle: string | undefined, statut: string, dateStatut?: string): Chevre =>
  ({ id: numeroBoucle ?? Math.random().toString(), numeroBoucle, statut, dateStatut, sexe: 'M', dateNaissance: '2025-12-20' }) as unknown as Chevre;

describe('lots d’abattoir', () => {
  it('un lot par jour d’abattage, avec les boucles des animaux abattus ce jour-là', () => {
    const lots = lotsDAbattoir(
      [
        animal('00837', 'abattoir', '2026-02-25'),
        animal('00836', 'abattoir', '2026-02-25'),
        animal('00900', 'abattoir', '2026-03-10'),
        animal(undefined, 'abattoir', '2026-02-25'),
        animal('00001', 'vivante'),
      ],
      [],
      (() => {
        let n = 0;
        return () => `id${++n}`;
      })(),
    );
    expect(lots?.map((l) => [l.nom, l.boucles, l.abattoir])).toEqual([
      ['Abattoir du 25/02/2026', '00836, 00837', '2026-02-25'],
      ['Abattoir du 10/03/2026', '00900', '2026-03-10'],
    ]);
  });

  it('un lot déjà à jour n’est pas refait ; un lot incomplet est complété ; les autres lots ne bougent pas', () => {
    const autre: LotAnimaux = { id: 'x', nom: 'Chevrettes 2026', boucles: '1, 2' };
    const existant: LotAnimaux = { id: 'a', nom: 'Abattoir du 25/02/2026', boucles: '00836', abattoir: '2026-02-25' };
    const bêtes = [animal('00836', 'abattoir', '2026-02-25'), animal('00837', 'abattoir', '2026-02-25')];
    const complete = lotsDAbattoir(bêtes, [autre, existant]);
    expect(complete?.find((l) => l.id === 'a')?.boucles).toBe('00836, 00837');
    expect(complete?.find((l) => l.id === 'x')).toEqual(autre);
    expect(lotsDAbattoir(bêtes, complete ?? [])).toBeNull();
  });
});
