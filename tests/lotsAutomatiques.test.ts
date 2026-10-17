import { describe, expect, it } from 'vitest';
import {
  dateDuLot,
  designationsDesLots,
  estCategorieAutomatique,
  estLotAutomatique,
  groupesDeLots,
  lotsDAbattoir,
  lotsDeRenouvellementDeLAnnee,
  retirerDesAutresLotsDeRenouvellement,
} from '@/features/exploitation/services/lots';
import { pageParente } from '@/bureau/retour';
import type { LotAnimaux } from '@/features/settings/settings';
import type { Chevre } from '@/features/cheptel/types';

const animal = (boucle: string, extra: Partial<Chevre> = {}): Chevre =>
  ({ id: boucle, sexe: 'F', statut: 'vivante', dateNaissance: '2022-03-01', numeroBoucle: boucle, ...extra }) as unknown as Chevre;
const lot = (extra: Partial<LotAnimaux>): LotAnimaux => ({ id: 'l' + Math.random(), nom: 'Lot', boucles: '', ...extra });

describe('lots de renouvellement', () => {
  it('un lot par année désignée, et celui de l’année courante, créés avec les animaux désignés', () => {
    const animaux = [
      animal('1', { renouvellement: true, renouvellementAnnee: 2024 }),
      animal('2', { renouvellement: true, renouvellementAnnee: 2024 }),
      animal('3', { renouvellement: true, renouvellementAnnee: 2025 }),
      animal('4'),
    ];
    let n = 0;
    const lots = lotsDeRenouvellementDeLAnnee(animaux, [], 2026, () => 'id' + ++n) as LotAnimaux[];
    expect(lots.map((l) => [l.nom, l.boucles, l.renouvellement])).toEqual([
      ['Renouvellement 2024', '1, 2', 2024],
      ['Renouvellement 2025', '3', 2025],
      ['Renouvellement 2026', '', 2026],
    ]);
    // Tout est là : rien à faire.
    expect(lotsDeRenouvellementDeLAnnee(animaux, lots, 2026)).toBeNull();
    // Un animal désigné de plus rejoint le lot existant, sans rien retirer de ce qui y est.
    const plus = lotsDeRenouvellementDeLAnnee([...animaux, animal('5', { renouvellement: true, renouvellementAnnee: 2024 })], lots, 2026) as LotAnimaux[];
    expect(plus.find((l) => l.renouvellement === 2024)?.boucles).toBe('1, 2, 5');
  });

  it('la désignation des animaux suit leur lot : ajout, retrait, et un seul lot par animal', () => {
    const animaux = [animal('1', { renouvellement: true, renouvellementAnnee: 2024 }), animal('2'), animal('3')];
    const l2024 = lot({ categorie: 'renouvellement', renouvellement: 2024, boucles: '2' });
    const l2025 = lot({ categorie: 'renouvellement', renouvellement: 2025, boucles: '2, 3' });
    // Le lot 2024 garde '2' mais plus '1' : '1' sort de la désignation ; '2' et '3' sont désignés pour le lot qui les a.
    const changes = designationsDesLots(animaux, [l2024, l2025], true);
    expect(changes.map((c) => [c.numeroBoucle, c.renouvellement, c.renouvellementAnnee])).toEqual([
      ['1', false, undefined],
      ['2', true, 2025],
      ['3', true, 2025],
    ]);
    // Sans retrait (la synchronisation), personne ne sort de la désignation.
    expect(designationsDesLots(animaux, [l2024], false).map((c) => c.numeroBoucle)).toEqual(['2']);
    // Un lot qui prend un animal le retire des autres lots de renouvellement.
    const apres = retirerDesAutresLotsDeRenouvellement([l2024, l2025], { ...l2025, boucles: '2, 3' });
    expect(apres.find((l) => l.renouvellement === 2024)?.boucles).toBe('');
  });

  it('les lots qui se créent tout seuls sont reconnus', () => {
    expect(estLotAutomatique(lot({ categorie: 'reproduction' }))).toBe(true);
    expect(estLotAutomatique(lot({ categorie: 'renouvellement' }))).toBe(true);
    expect(estLotAutomatique(lot({ categorie: 'veterinaire' }))).toBe(false);
    expect(estCategorieAutomatique('renouvellement')).toBe(true);
    expect(estCategorieAutomatique('abattoir')).toBe(false);
  });
});

describe('catégories de lots', () => {
  it('toutes les catégories ont leur bouton, les lots les plus récents d’abord', () => {
    const categories = [
      { id: 'abattoir', nom: 'Abattoir' },
      { id: 'veterinaire', nom: 'Vétérinaire' },
    ];
    const lots = [
      lot({ nom: 'Visite vétérinaire du 17/09/2024', categorie: 'veterinaire' }),
      lot({ nom: 'Visite vétérinaire du 26/08/2026', categorie: 'veterinaire' }),
      lot({ nom: 'Visite vétérinaire du 26/10/2023', categorie: 'veterinaire' }),
      lot({ nom: 'Mon lot' }),
    ];
    const groupes = groupesDeLots(lots, categories, 'Autres lots', true);
    expect(groupes.map((g) => [g.id, g.lots.length])).toEqual([
      ['abattoir', 0],
      ['veterinaire', 3],
      ['autres', 1],
    ]);
    expect(groupes[1].lots.map((l) => l.nom)).toEqual([
      'Visite vétérinaire du 26/08/2026',
      'Visite vétérinaire du 17/09/2024',
      'Visite vétérinaire du 26/10/2023',
    ]);
    // Sans « toutes », seules les catégories qui ont des lots.
    expect(groupesDeLots(lots, categories, 'Autres lots').map((g) => g.id)).toEqual(['veterinaire', 'autres']);
    expect(dateDuLot(lot({ abattoir: '2025-02-12' }))).toBe('2025-02-12');
    expect(dateDuLot(lot({ reproduction: 2026 }))).toBe('2026-01-01');
  });

  it('un lot d’abattoir déjà là sans catégorie reçoit la catégorie Abattoir', () => {
    const lots = [lot({ id: 'a', nom: 'Abattoir du 25/02/2026', abattoir: '2026-02-25', boucles: '1' })];
    const suite = lotsDAbattoir([animal('1', { statut: 'abattoir', dateStatut: '2026-02-25' })], lots) as LotAnimaux[];
    expect(suite[0].categorie).toBe('abattoir');
  });
});

describe('flèche de retour d’un lot', () => {
  it('un lot revient aux lots d’animaux, pas aux animaux', () => {
    expect(pageParente('/cheptel/lot?id=abc')).toBe('/cheptel/lots');
    expect(pageParente('/cheptel/lots-categorie?categorie=abattoir')).toBe('/cheptel/lots');
    expect(pageParente('/cheptel/traitement?id=x')).toBe('/cheptel/traitements');
    expect(pageParente('/cheptel/naissance-nouvelle')).toBe('/cheptel/naissances');
    expect(pageParente('/sante/veterinaire/visite?id=x')).toBe('/sante/controles/liste?famille=animaux&onglet=sante');
  });
});
