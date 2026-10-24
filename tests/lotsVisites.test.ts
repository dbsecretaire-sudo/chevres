import { describe, expect, it } from 'vitest';
import { categoriesDeLots, retirerLesLotsDeVisites } from '@/features/exploitation/services/lots';
import type { Traitement, VisiteVeterinaire } from '@/features/exploitation/types';
import type { LotAnimaux } from '@/features/settings/settings';

const visite = (id: string, extra: Record<string, unknown> = {}): VisiteVeterinaire =>
  ({ id, date: '2026-08-26', motif: 'Prophylaxie', ...extra }) as VisiteVeterinaire;
const ancienLot = (id: string, boucles: string, visiteId?: string): LotAnimaux =>
  ({ id, nom: 'Visite vétérinaire du 26/08/2026', boucles, categorie: 'veterinaire', visiteId }) as unknown as LotAnimaux;
const traitement = (id: string, extra: Partial<Traitement> = {}): Traitement => ({ id, date: '2026-08-26', produit: 'p', ...extra });

describe('les lots de visites vétérinaires n’existent plus', () => {
  it('le lot de la visite est retiré ; la visite garde ses boucles et n’a plus de lot', () => {
    const r = retirerLesLotsDeVisites(
      [ancienLot('l1', '30002, 10001', 'v1'), { id: 'libre', nom: 'Chevrettes', boucles: '5' } as LotAnimaux],
      [visite('v1', { lotId: 'l1', chevreNumeroBoucle: '1' })],
      [],
    );
    expect(r.lots?.map((l) => l.id)).toEqual(['libre']);
    expect(r.visites).toHaveLength(1);
    expect(r.visites[0].chevreNumeroBoucle).toBe('10001, 30002');
    expect('lotId' in r.visites[0]).toBe(false);
  });

  it('un lot vide (troupeau entier) laisse la visite sans boucle', () => {
    const r = retirerLesLotsDeVisites([ancienLot('l1', '', 'v1')], [visite('v1', { lotId: 'l1' })], []);
    expect(r.visites[0].chevreNumeroBoucle).toBeUndefined();
  });

  it('un traitement donné au lot se rattache à la visite (sa facture), sans le lot', () => {
    const r = retirerLesLotsDeVisites(
      [ancienLot('l1', '1', 'v1')],
      [visite('v1', { lotId: 'l1', factureId: 'f1' })],
      [traitement('t1', { lotId: 'l1' }), traitement('t2', { lotId: 'autre' })],
    );
    expect(r.traitements).toHaveLength(1);
    expect(r.traitements[0]).toMatchObject({ id: 't1', visiteId: 'f1' });
    expect('lotId' in r.traitements[0]).toBe(false);
  });

  it('une fois fait, plus rien à changer', () => {
    const r = retirerLesLotsDeVisites([{ id: 'libre', nom: 'Chevrettes', boucles: '5' } as LotAnimaux], [visite('v1')], [traitement('t1')]);
    expect(r).toEqual({ lots: null, visites: [], traitements: [] });
  });

  it('la catégorie « Vétérinaire » n’est plus proposée, même gardée dans les réglages', () => {
    expect(categoriesDeLots([], [{ id: 'veterinaire', nom: 'Vétérinaire' }]).some((c) => c.id === 'veterinaire')).toBe(false);
    expect(categoriesDeLots().some((c) => c.id === 'veterinaire')).toBe(false);
  });
});
