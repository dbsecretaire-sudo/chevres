import { describe, expect, it } from 'vitest';
import { lotsSansBonEquarrissage } from '@/features/exploitation/services/lots';
import type { LotAnimaux } from '@/features/settings/settings';

const lot = (extra: Partial<LotAnimaux>): LotAnimaux => ({ id: 'l', nom: 'Lot', boucles: '', ...extra });
const piece = { id: 'p', nom: 'bon.pdf', extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-22' };

describe('rappel du bon d’équarrissage', () => {
  it('ne rappelle que les lots d’équarrissage sans fichier joint', () => {
    const lots = [
      lot({ id: 'a', categorie: 'equarrissage' }),
      lot({ id: 'b', categorie: 'equarrissage', fichiers: [piece] }),
      lot({ id: 'c', categorie: 'abattoir' }),
      lot({ id: 'd' }),
    ];
    expect(lotsSansBonEquarrissage(lots).map((l) => l.id)).toEqual(['a']);
  });

  it('sans lot, rien à rappeler', () => {
    expect(lotsSansBonEquarrissage(undefined)).toEqual([]);
  });
});
