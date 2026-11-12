import { describe, expect, it } from 'vitest';
import { misesBasDeLaSaison } from '@/features/cheptel/services/misesBasSaison';
import type { Chevre } from '@/features/cheptel/types';

const petit = (mere: string, dateNaissance: string) => ({ mereNumeroBoucle: mere, dateNaissance }) as Chevre;

describe('mises bas de la saison', () => {
  it('les tardifs (2e semestre de l’année d’avant) et le 1er semestre de l’année, par mère', () => {
    const cheptel = [
      petit('40005', '2025-03-12'),
      petit('40005', '2025-06-30'),
      petit('40005', '2025-07-01'),
      petit('40005', '2026-08-20'),
      petit('40005', '2026-01-15'),
      petit('40006', '2026-05-20'),
      petit('40006', '2024-12-20'),
    ];
    const saison = misesBasDeLaSaison(cheptel, 2026);
    expect(saison['40005']).toEqual({
      tardifs: ['2025-07-01'],
      premierSemestre: ['2026-01-15'],
    });
    expect(saison['40006']).toEqual({ tardifs: [], premierSemestre: ['2026-05-20'] });
  });

  it('une même date n’est donnée qu’une fois, et une mère sans mise bas dans la saison n’apparaît pas', () => {
    const cheptel = [petit('30025', '2026-02-01'), petit('30025', '2026-02-01'), petit('30030', '2024-05-05')];
    const saison = misesBasDeLaSaison(cheptel, 2026);
    expect(saison['30025'].premierSemestre).toEqual(['2026-02-01']);
    expect(saison['30030']).toBeUndefined();
  });
});
