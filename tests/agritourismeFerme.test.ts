import { describe, expect, it } from 'vitest';
import { compterAgritourisme } from '@/features/accueil/services/agritourismeFerme';
import type { VisiteAgritourisme } from '@/features/commercial/types';

const visite = (surcharge: Partial<VisiteAgritourisme>): VisiteAgritourisme => ({
  id: 'v',
  date: '2026-07-10',
  client: 'Groupe',
  formuleId: 'f',
  formule: 'Visite',
  participants: 10,
  prixParPersonne: 20,
  statut: 'prevue',
  ...surcharge,
});

describe('les comptes de l’agritourisme sur l’accueil', () => {
  it('compte les visites prévues, les visiteurs et les recettes de l’année, sans les annulées ni les autres années', () => {
    const c = compterAgritourisme(
      [
        visite({ id: 'a', statut: 'prevue' }),
        visite({ id: 'b', statut: 'realisee', participants: 5 }),
        visite({ id: 'c', statut: 'annulee', participants: 50 }),
        visite({ id: 'd', date: '2025-07-10', statut: 'realisee', participants: 99 }),
      ],
      2026,
    );
    expect(c.aVenir).toBe(1);
    expect(c.visiteurs).toBe(15);
    expect(c.recettes).toBe(300);
  });

  it('une ferme sans visite : des zéros', () => {
    expect(compterAgritourisme([], 2026)).toEqual({ aVenir: 0, visiteurs: 0, recettes: 0 });
  });
});
