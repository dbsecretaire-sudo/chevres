import { describe, expect, it } from 'vitest';
import { lotsDAbattoirSansFacture, retraitDesLotsDAbattoir } from '@/features/exploitation/services/lotsSansFacture';
import type { Chevre } from '@/features/cheptel/types';
import type { LotAnimaux } from '@/features/settings/settings';

const animal = (id: string, boucle: string, statut: string) => ({ id, numeroBoucle: boucle, statut }) as unknown as Chevre;
const lot = (id: string, extra: Partial<LotAnimaux> = {}): LotAnimaux => ({ id, nom: id, boucles: '', ...extra });

describe('lots d’abattoir dont la facture est supprimée', () => {
  it('seul un lot d’abattoir lié à une facture absente est retiré', () => {
    const lots = [
      lot('a', { abattoir: '2025-02-12', factureId: 'f1' }),
      lot('b', { abattoir: '2025-08-04', factureId: 'f2' }),
      lot('c', { abattoir: '2024-01-01' }),
      lot('d', { factureId: 'f9' }),
    ];
    expect(lotsDAbattoirSansFacture(lots, new Set(['f1'])).map((l) => l.id)).toEqual(['b']);
  });

  it('le lot disparaît et ses animaux à l’abattoir reviennent vivants, sauf ceux d’une vente', () => {
    const lots = [lot('a', { abattoir: '2025-02-12', factureId: 'f1', boucles: '1, 2, 3' }), lot('z', { boucles: '9' })];
    const animaux = [animal('x1', '1', 'abattoir'), animal('x2', '2', 'abattoir'), animal('x3', '3', 'vivante'), animal('x9', '9', 'abattoir')];
    const r = retraitDesLotsDAbattoir(lots, [lots[0]], animaux, new Set(['x2']));
    expect(r.lots.map((l) => l.id)).toEqual(['z']);
    expect(r.aReactiver).toEqual(['x1']);
  });
});
