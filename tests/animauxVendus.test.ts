import { describe, expect, it } from 'vitest';
import { sontDesCabris } from '@/features/comptabilite/utils/animauxVendus';

describe('cabris d’un jour d’abattage', () => {
  it('un abattage dans les deux mois avant la facture : d’office des cabris, même si le premier animal n’est plus un petit', () => {
    expect(sontDesCabris('2026-02-12', '2026-03-01', false)).toBe(true);
    expect(sontDesCabris('2026-02-12', '2026-04-12', false)).toBe(true);
    expect(sontDesCabris('2026-02-12', '2026-02-12', false)).toBe(true);
  });

  it('plus ancien, ou facturé avant d’être abattu : l’âge des animaux décide', () => {
    expect(sontDesCabris('2026-02-12', '2026-04-13', false)).toBe(false);
    expect(sontDesCabris('2026-02-12', '2026-04-13', true)).toBe(true);
    expect(sontDesCabris('2026-02-12', '2026-02-01', false)).toBe(false);
  });
});
