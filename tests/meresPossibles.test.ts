import { describe, expect, it } from 'vitest';
import { meresPossiblesLe } from '@/features/cheptel/services/meresPossibles';
import type { Chevre } from '@/features/cheptel/types';

const animal = (numeroBoucle: string, sexe: 'F' | 'M', dateNaissance: string, extra: Partial<Chevre> = {}): Chevre =>
  ({ id: numeroBoucle, numeroBoucle, sexe, dateNaissance, statut: 'vivante', ...extra }) as unknown as Chevre;

describe('mères possibles d’un petit', () => {
  const presentes = [
    animal('1', 'F', '2024-01-10'), // adulte
    animal('2', 'F', '2026-01-10'), // trop jeune au 2026-03-05
    animal('3', 'M', '2023-01-10'), // un bouc
    animal('4', 'F', '2024-02-01', { statut: 'vendue', dateStatut: '2026-09-01' }), // vendue depuis : elle y était
    animal('5', 'F', '2025-08-01'), // 7 mois au 2026-03-05
    animal('6', 'F', '2025-10-01'), // 5 mois : trop jeune
  ];

  it('les femelles de plus de 6 mois à la naissance, sans les boucs ni les trop jeunes', () => {
    expect(meresPossiblesLe(presentes, '2026-03-05').map((c) => c.numeroBoucle)).toEqual(['1', '4', '5']);
  });

  it('la mère déjà choisie reste proposée', () => {
    expect(meresPossiblesLe(presentes, '2026-03-05', '2').map((c) => c.numeroBoucle)).toEqual(['1', '2', '4', '5']);
  });
});
