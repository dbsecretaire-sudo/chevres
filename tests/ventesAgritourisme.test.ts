import { describe, expect, it } from 'vitest';
import { statistiquesVentes } from '@/features/commercial/services/statistiques';
import { produitDeLaVisite, ventesDesVisites } from '@/features/commercial/services/ventesAgritourisme';
import type { VisiteAgritourisme } from '@/features/commercial/types';
import { STATUT_VISITE } from '@/shared/constants/agritourisme';

const visite = (extra: Partial<VisiteAgritourisme>): VisiteAgritourisme => ({
  id: 'v',
  date: '2026-06-10',
  client: 'Groupe scolaire',
  formuleId: 'f1',
  formule: 'Visite et dégustation',
  participants: 10,
  prixParPersonne: 12,
  statut: STATUT_VISITE.REALISEE,
  ...extra,
});

describe('les ventes de l’agritourisme', () => {
  it('ne comptent que les visites réalisées de l’année', () => {
    const ventes = ventesDesVisites(
      [
        visite({ id: 'a' }),
        visite({ id: 'b', statut: STATUT_VISITE.PREVUE }),
        visite({ id: 'c', statut: STATUT_VISITE.ANNULEE }),
        visite({ id: 'd', date: '2025-06-10' }),
      ],
      2026,
    );
    expect(ventes.map((v) => v.id)).toEqual(['a']);
    expect(ventesDesVisites([visite({ id: 'a' }), visite({ id: 'd', date: '2025-06-10' })])).toHaveLength(2);
  });

  it('donnent le chiffre d’affaires par formule, par groupe et ce qui reste à encaisser', () => {
    const ventes = ventesDesVisites([
      visite({ id: 'a' }),
      visite({ id: 'b', date: '2026-07-01', participants: 5, enAttente: true, echeance: '2026-08-01' }),
      visite({ id: 'c', formule: 'Repas à la ferme', formuleId: 'f2', client: 'Famille Dupont', participants: 4, prixParPersonne: 30 }),
    ]);
    const stats = statistiquesVentes(ventes, '2026-09-01', 'Sans groupe', produitDeLaVisite);
    expect(stats.total).toBe(300);
    expect(stats.nombre).toBe(3);
    expect(stats.produits.map((p) => [p.libelle, p.montant, p.quantite, p.unite])).toEqual([
      ['Visite et dégustation', 180, 15, 'pers.'],
      ['Repas à la ferme', 120, 4, 'pers.'],
    ]);
    expect(stats.totalImpaye).toBe(60);
    expect(stats.impayes[0].retard).toBe(31);
  });
});
