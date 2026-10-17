import { describe, expect, it } from 'vitest';
import { accorderLotsEtVisites, categoriesDeLots, groupesDeLots } from '@/features/exploitation/services/lots';
import type { VisiteVeterinaire } from '@/features/exploitation/types';
import type { LotAnimaux } from '@/features/settings/settings';

const visite = (id: string, date: string, boucles?: string, lotId?: string): VisiteVeterinaire =>
  ({ id, date, motif: 'Prophylaxie', chevreNumeroBoucle: boucles, lotId }) as VisiteVeterinaire;
let n = 0;
const id = () => `lot${++n}`;

describe('lots et visites vétérinaires d’accord', () => {
  it('une visite qui a des boucles reçoit un lot « Visite vétérinaire du … » de catégorie vétérinaire', () => {
    const r = accorderLotsEtVisites([visite('v1', '2026-08-26', '30002, 10001')], [], id);
    expect(r.lots).toHaveLength(1);
    expect(r.lots?.[0]).toMatchObject({ nom: 'Visite vétérinaire du 26/08/2026', boucles: '10001, 30002', visiteId: 'v1', categorie: 'veterinaire' });
    expect(r.visites[0].lotId).toBe(r.lots?.[0].id);
  });

  it('un lot fait à la main, aux mêmes boucles, est adopté (renommé), pas doublé', () => {
    const manuel: LotAnimaux = { id: 'm', nom: 'Visite vétérinaire du 2025-09-20', boucles: '1, 2' };
    const r = accorderLotsEtVisites([visite('v1', '2025-09-20', '2, 1')], [manuel], id);
    expect(r.lots).toHaveLength(1);
    expect(r.lots?.[0]).toMatchObject({ id: 'm', nom: 'Visite vétérinaire du 20/09/2025', visiteId: 'v1', categorie: 'veterinaire' });
    expect(r.visites[0].lotId).toBe('m');
  });

  it('une visite prend les boucles de son lot (le lot est la source) ; sans boucle, le troupeau entier', () => {
    const lot: LotAnimaux = { id: 'l', nom: 'Chevrettes', boucles: '5, 6', categorie: undefined };
    expect(accorderLotsEtVisites([visite('v1', '2026-01-01', '1', 'l')], [lot], id).visites[0].chevreNumeroBoucle).toBe('5, 6');
    const vide: LotAnimaux = { id: 'l', nom: 'Chevrettes', boucles: '' };
    expect(accorderLotsEtVisites([visite('v1', '2026-01-01', '1', 'l')], [vide], id).visites[0].chevreNumeroBoucle).toBeUndefined();
    // Déjà d'accord : rien à changer.
    expect(accorderLotsEtVisites([visite('v1', '2026-01-01', '5, 6', 'l')], [lot], id)).toEqual({ lots: null, visites: [] });
  });

  it('le lot d’une visite suit la date de la visite', () => {
    const lot: LotAnimaux = { id: 'l', nom: 'Visite vétérinaire du 26/08/2026', boucles: '1', visiteId: 'v1', categorie: 'veterinaire' };
    const r = accorderLotsEtVisites([visite('v1', '2026-09-01', '1', 'l')], [lot], id);
    expect(r.lots?.[0].nom).toBe('Visite vétérinaire du 01/09/2026');
  });

  it('les lots rangés par catégorie : abattoir, vétérinaire, celles ajoutées, puis les autres', () => {
    const lots: LotAnimaux[] = [
      { id: 'a', nom: 'A', boucles: '', categorie: 'veterinaire' },
      { id: 'b', nom: 'B', boucles: '', categorie: 'abattoir' },
      { id: 'c', nom: 'C', boucles: '' },
      { id: 'd', nom: 'D', boucles: '', categorie: 'Reproduction' },
      { id: 'e', nom: 'E', boucles: '', categorie: 'Disparue' },
    ];
    const groupes = groupesDeLots(lots, categoriesDeLots(['Reproduction']), 'Autres lots');
    expect(groupes.map((g) => [g.nom, g.lots.map((l) => l.id)])).toEqual([
      ['Abattoir', ['b']],
      ['Vétérinaire', ['a']],
      ['Reproduction', ['d']],
      ['Autres lots', ['c', 'e']],
    ]);
  });
});
