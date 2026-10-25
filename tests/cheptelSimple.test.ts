import { describe, expect, it } from 'vitest';
import { chiffresCheptel, estChevrette, filtrerCheptel } from '@/features/berger/services/cheptelSimple';
import type { Chevre } from '@/features/cheptel/types';

const animal = (numeroBoucle: string, sexe: 'F' | 'M', dateNaissance: string) =>
  ({ id: numeroBoucle, numeroBoucle, sexe, dateNaissance }) as unknown as Chevre;

const troupeau = [
  animal('00467', 'F', '2026-03-01'),
  animal('00463', 'F', '2023-05-10'),
  animal('00871', 'M', '2026-02-14'),
  animal('00120', 'M', '2022-07-02'),
];

describe('la liste du cheptel', () => {
  it('une chevrette est une femelle née il y a moins d’un an', () => {
    expect(estChevrette(animal('1', 'F', '2026-02-01'), '2026-10-25')).toBe(true);
    expect(estChevrette(animal('2', 'F', '2024-10-01'), '2026-10-25')).toBe(false);
    expect(estChevrette(animal('3', 'M', '2026-02-01'), '2026-10-25')).toBe(false);
  });

  it('les filtres se succèdent : toutes, femelles, mâles, chevrettes', () => {
    expect(filtrerCheptel(troupeau, 'toutes', '', '2026-10-25')).toHaveLength(4);
    expect(filtrerCheptel(troupeau, 'femelles', '', '2026-10-25').map((a) => a.numeroBoucle)).toEqual(['00463', '00467']);
    expect(filtrerCheptel(troupeau, 'males', '', '2026-10-25').map((a) => a.numeroBoucle)).toEqual(['00120', '00871']);
    expect(filtrerCheptel(troupeau, 'chevrettes', '', '2026-10-25').map((a) => a.numeroBoucle)).toEqual(['00467']);
  });

  it('la recherche cherche dans les boucles, et range par numéro', () => {
    expect(filtrerCheptel(troupeau, 'toutes', '46', '2026-10-25').map((a) => a.numeroBoucle)).toEqual(['00463', '00467']);
  });

  it('les chiffres d’en-tête comptent les vivants et les nées de l’année', () => {
    expect(chiffresCheptel(troupeau, 2026)).toEqual({ vivantes: 4, nees: 2 });
  });
});
