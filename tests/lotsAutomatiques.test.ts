import { describe, expect, it } from 'vitest';
import {
  categoriesDeLots,
  dateDuLot,
  designationsDesLots,
  estCategorieAutomatique,
  estCategorieDeLotsProtegee,
  estLotAutomatique,
  groupesDeLots,
  boucleDesFemellesALaReproduction,
  lotsDAbattoir,
  lotsDeReproductionDeLAnnee,
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

describe('lots de mise à la reproduction', () => {
  it('les mères de l’année et les femelles vivantes à la date d’une mise bas, majeures ; recalculés une fois', () => {
    const mere = (b: string, extra: Partial<Chevre> = {}) => animal(b, { dateNaissance: '2019-03-01', ...extra });
    const animaux = [
      mere('1'),
      mere('2', { statut: 'vendue', dateStatut: '2022-01-15' }), // vendue avant la première mise bas : pas dans le lot
      mere('3', { statut: 'morte', dateStatut: '2022-06-01' }), // vivante à la mise bas de février : dans le lot
      mere('4', { dateNaissance: '2021-11-01' }), // 3 mois à la mise bas : pas majeure
      animal('9', { sexe: 'M', dateNaissance: '2019-03-01' }), // un bouc
      animal('100', { dateNaissance: '2022-02-10', mereNumeroBoucle: '1' }), // naissance du 10/02/2022
      animal('101', { dateNaissance: '2022-02-12', mereNumeroBoucle: '77' }), // une mère inconnue du cheptel
    ];
    expect(boucleDesFemellesALaReproduction(animaux, 2022)).toEqual(['1', '3', '77']);
    // Un ancien lot (sans version de calcul) est recalculé, une seule fois : le lot corrigé ensuite est gardé.
    const ancien = lot({ id: 'r', categorie: 'reproduction', reproduction: 2022, boucles: '1, 2, 3, 4' });
    const recalcule = lotsDeReproductionDeLAnnee(animaux, [ancien], 2022) as LotAnimaux[];
    const lot2022 = recalcule.find((l) => l.reproduction === 2022)!;
    expect(lot2022.boucles).toBe('1, 3, 77');
    expect(lot2022.versionCalcul).toBe(2);
    const corrige = recalcule.map((l) => (l.reproduction === 2022 ? { ...l, boucles: '1, 3' } : l));
    expect(lotsDeReproductionDeLAnnee(animaux, corrige, 2022)).toBeNull();
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

describe('gestion des catégories de lots', () => {
  it('sans réglage : celles d’office puis celles ajoutées ; avec une liste : ses noms et son ordre, les catégories d’office toujours là', () => {
    expect(categoriesDeLots(['Chevrettes']).map((c) => c.id)).toEqual(['abattoir', 'veterinaire', 'reproduction', 'renouvellement', 'Chevrettes']);
    const liste = [
      { id: 'renouvellement', nom: 'Futures chèvres' },
      { id: 'abc', nom: 'Chevrettes' },
      { id: 'abattoir', nom: 'Boucherie' },
    ];
    const categories = categoriesDeLots([], liste);
    // Vétérinaire et Mises à la reproduction manquaient de la liste : elles reviennent en tête.
    expect(categories.map((c) => c.id)).toEqual(['veterinaire', 'reproduction', 'renouvellement', 'abc', 'abattoir']);
    expect(categories.find((c) => c.id === 'renouvellement')?.nom).toBe('Futures chèvres');
    expect(estCategorieDeLotsProtegee('abattoir')).toBe(true);
    expect(estCategorieDeLotsProtegee('abc')).toBe(false);
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
