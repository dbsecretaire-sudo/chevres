import { describe, expect, it } from 'vitest';
import { ecrituresACirculation } from '@/features/comptabilite/services/documentsCirculation';
import type { Facture } from '@/features/comptabilite/types';
import type { LotAnimaux } from '@/features/settings/settings';

const lot: LotAnimaux = {
  id: 'L1',
  nom: 'Abattoir du 21/10/2026',
  boucles: 'FR1, FR2',
  categorie: 'abattoir',
  abattoir: '2026-10-21',
  depart: true,
};

const facture = (surcharge: Partial<Facture>): Facture =>
  ({
    id: 'F1',
    type: 'recue',
    date: '2026-10-25',
    tiers: 'Abattoir de Test',
    description: 'Abattage',
    montant: 120,
    ...surcharge,
  }) as Facture;

describe('documents de circulation : un par lot de départ', () => {
  it('un lot sans écriture se liste seul, avec son document et aucune écriture liée', () => {
    const e = ecrituresACirculation([], [], new Set(), [lot]);
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({ cle: 'lot:L1', type: 'lot', date: '2026-10-21', liees: [] });
  });

  it('la facture de l’abattoir rattachée au lot n’a pas de ligne à part : elle est dans les écritures du lot, à sa propre date', () => {
    const e = ecrituresACirculation([], [facture({ lotId: 'L1' })], new Set(['abattoir de test']), [lot]);
    expect(e.map((x) => x.cle)).toEqual(['lot:L1']);
    expect(e[0].liees).toEqual([
      expect.objectContaining({ type: 'facture', id: 'F1', date: '2026-10-25', role: 'prestation', montant: -120 }),
    ]);
  });

  it('une facture d’abattoir sans lot garde sa propre ligne', () => {
    const e = ecrituresACirculation([], [facture({})], new Set(['abattoir de test']), []);
    expect(e.map((x) => x.cle)).toEqual(['facture:F1']);
  });
});
