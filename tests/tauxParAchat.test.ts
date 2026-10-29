import { describe, expect, it } from 'vitest';
import { tauxCommun, ventilationTva, tvaDuTtc } from '@/features/comptabilite/utils/tva';

describe('TVA par achat', () => {
  it('garde le taux commun quand tous les achats ont le même taux', () => {
    expect(tauxCommun([{ tauxTva: 5.5 }, { tauxTva: 5.5 }])).toBe(5.5);
  });

  it('ne donne pas de taux commun quand les achats en ont plusieurs', () => {
    expect(tauxCommun([{ tauxTva: 5.5 }, { tauxTva: 20 }])).toBeUndefined();
    expect(tauxCommun([])).toBeUndefined();
  });

  it('compte une facture sans lignes en un seul bloc à son taux', () => {
    expect(ventilationTva({ montant: 110, tauxTva: 10 })).toEqual([{ taux: 10, ttc: 110 }]);
    expect(ventilationTva({ montant: 110 })).toEqual([]);
  });

  it('répartit une facture à plusieurs taux, un achat sans taux prenant celui de la facture', () => {
    const f = {
      montant: 131,
      tauxTva: 10,
      lignesAlimentation: [
        { montant: 110, tauxTva: 10 },
        { montant: 21, tauxTva: 5.5 },
        { montant: 0.5 },
      ],
    };
    const ventilation = ventilationTva(f);
    expect(ventilation).toEqual([
      { taux: 10, ttc: 110.5 },
      { taux: 5.5, ttc: 21 },
    ]);
    expect(tvaDuTtc(21, 5.5)).toBeCloseTo(1.09, 2);
  });
});
