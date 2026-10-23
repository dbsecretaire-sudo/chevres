import { describe, expect, it } from 'vitest';
import { rapportsDeLaVisite, traitementsDeLaVisite } from '@/features/exploitation/services/visitesEtTraitements';
import type { Traitement } from '@/features/exploitation/types';
import type { DocumentGdsDepose } from '@/features/settings/settings';

const traitement = (id: string, date: string, extra: Partial<Traitement> = {}): Traitement => ({ id, date, produit: `produit ${id}`, ...extra });

describe('traitements d’une visite du vétérinaire', () => {
  const traitements = [
    traitement('a', '2026-03-12', { lotId: 'lot1' }),
    traitement('b', '2026-03-10', { lotId: 'lot1' }),
    traitement('c', '2026-03-10'),
    traitement('d', '2026-04-01', { lotId: 'lot2' }),
    traitement('e', '2026-05-05', { visiteId: 'v9', lotId: 'lot1' }),
  ];

  it('un traitement rattaché à une visite est à elle seule, quel que soit son lot ou sa date', () => {
    expect(traitementsDeLaVisite({ id: 'v9', lotId: 'lotX', date: '2026-01-01' }, traitements).map((t) => t.id)).toEqual(['e']);
    expect(traitementsDeLaVisite({ id: 'v1', lotId: 'lot1', date: '2026-03-10' }, traitements).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('sans rattachement : les traitements du lot de la visite, du premier au dernier donné', () => {
    expect(traitementsDeLaVisite({ id: 'v1', lotId: 'lot1', date: '2026-03-10' }, traitements).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('sans lot : les traitements donnés le jour même', () => {
    expect(traitementsDeLaVisite({ id: 'v1', date: '2026-03-10' }, traitements).map((t) => t.id)).toEqual(['b', 'c']);
  });

  it('aucun traitement lié : une liste vide (la page dit « Pas de traitement prescrit »)', () => {
    expect(traitementsDeLaVisite({ id: 'v1', lotId: 'lotX', date: '2026-01-01' }, traitements)).toEqual([]);
  });
});

describe('rapports d’essais d’une visite', () => {
  const piece = (id: string, visiteId?: string): DocumentGdsDepose => ({ piece: { id, nom: id } as DocumentGdsDepose['piece'], deposeLe: '2026-03-10T10:00:00Z', visiteId });

  it('seuls les rapports rattachés à la visite', () => {
    const rapports = [piece('r1', 'v1'), piece('r2', 'v2'), piece('r3')];
    expect(rapportsDeLaVisite('v1', rapports).map((r) => r.piece.id)).toEqual(['r1']);
    expect(rapportsDeLaVisite('v7', rapports)).toEqual([]);
  });
});
