import { describe, expect, it } from 'vitest';
import { recensementAnnuel } from '@/features/cheptel/services/recensement';
import type { Chevre } from '@/features/cheptel/types';

const animal = (naissance: string, sexe: 'F' | 'M', statut = 'vivante', dateStatut?: string, numeroBoucle = `B${Math.random()}`): Chevre =>
  ({ id: naissance + sexe + statut + numeroBoucle, sexe, statut, dateStatut, dateNaissance: naissance, numeroBoucle }) as unknown as Chevre;

describe('recensement annuel au 1er janvier', () => {
  it('compte les animaux de plus de 6 mois ce jour-là, nés avant l’année des naissances, femelles et mâles', () => {
    const r = recensementAnnuel(
      [
        animal('2022-03-01', 'F'),
        animal('2023-04-01', 'F'),
        animal('2021-02-01', 'M'),
        animal('2025-07-15', 'F'), // 5 mois et demi au 1er janvier : trop jeune
        animal('2025-06-30', 'F'), // né l'année d'avant : il compte dans les naissances, pas dans les effectifs
        animal('2026-02-01', 'F'), // pas encore né
      ],
      2026,
    );
    expect(r).toMatchObject({ femelles: 2, males: 1 });
  });

  it('un animal sorti avant le 1er janvier n’y est plus ; sorti après, il y est encore', () => {
    const r = recensementAnnuel(
      [
        animal('2022-03-01', 'F', 'vendue', '2025-11-10'),
        animal('2022-03-01', 'F', 'morte', '2026-01-01'),
        animal('2022-03-01', 'F', 'vendue', '2026-02-10'),
        animal('2022-03-01', 'M', 'abattoir', '2026-01-02'),
      ],
      2026,
    );
    expect(r).toMatchObject({ femelles: 1, males: 1 });
  });

  it('les nés de l’année d’avant : présents, vendus, consommés et morts sur l’exploitation, sans les mort-nés', () => {
    const r = recensementAnnuel(
      [
        animal('2025-02-01', 'F'),
        animal('2025-02-01', 'M', 'vendue', '2025-03-01'),
        animal('2025-03-01', 'F', 'autoconsommee', '2025-04-01'),
        animal('2025-03-01', 'F', 'abattoir', '2025-05-01'),
        animal('2025-04-01', 'F', 'morte', '2025-04-20'),
        animal('2025-04-01', 'F', 'mortne'),
        animal('2024-12-31', 'F'), // né en 2024 : pas dans les nés de 2025
        animal('2026-01-10', 'F'), // né en 2026 : pas encore
      ],
      2026,
    );
    expect(r.nes).toBe(5);
  });

  it('un petit sans boucle auto-consommé compte dans les nés', () => {
    const r = recensementAnnuel([animal('2026-03-01', 'M', 'autoconsommee', '2026-04-01', ''), animal('2026-03-05', 'F', 'vivante', undefined, '')], 2027);
    expect(r.nes).toBe(1);
  });

  it('les petits sans boucle ne comptent pas dans les nés', () => {
    const r = recensementAnnuel(
      [
        animal('2026-02-01', 'F'),
        animal('2026-03-01', 'M', 'vendue', '2026-04-01', ''),
        animal('2026-03-05', 'F', 'vivante', undefined, '   '),
      ],
      2027,
    );
    expect(r.nes).toBe(1);
  });
});
