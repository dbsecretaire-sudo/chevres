import { describe, expect, it } from 'vitest';
import { moisEntre, mouvementsDeLAnnee, pyramideDesAges } from '@/features/cheptel/services/tableauDeBord';
import type { Chevre } from '@/features/cheptel/types';
import type { LigneMouvement } from '@/features/cheptel/services/suiviMouvements';

const animal = (naissance: string, sexe: 'F' | 'M' = 'F', statut = 'vivante'): Chevre =>
  ({ id: naissance + sexe, sexe, statut, dateNaissance: naissance }) as unknown as Chevre;

describe('pyramide des âges', () => {
  it('compte les mois révolus', () => {
    expect(moisEntre('2026-01-15', '2026-07-14')).toBe(5);
    expect(moisEntre('2026-01-15', '2026-07-15')).toBe(6);
    expect(moisEntre('2025-10-31', '2026-10-16')).toBe(11);
    expect(moisEntre('2026-10-17', '2026-10-16')).toBe(0);
  });

  it('range les vivants par classe d’âge, femelles et mâles', () => {
    const jour = '2026-10-16';
    const classes = pyramideDesAges(
      [
        animal('2026-08-01'), // 2 mois
        animal('2026-09-01', 'M'), // 1 mois
        animal('2026-02-01'), // 8 mois
        animal('2025-05-01'), // 17 mois
        animal('2024-03-01'), // 31 mois
        animal('2021-01-01', 'M'), // 5 ans et +
        animal('2021-01-01', 'F', 'morte'), // morte : ne compte pas
        animal('2027-01-01'), // pas encore née à cette date
      ],
      jour,
    );
    const par = Object.fromEntries(classes.map((c) => [c.cle, [c.femelles, c.males]]));
    expect(par).toEqual({
      moins6: [1, 1],
      de6a12: [1, 0],
      de1a2: [1, 0],
      de2a3: [1, 0],
      de3a4: [0, 0],
      de4a5: [0, 0],
      plus5: [0, 1],
    });
  });

  it('un animal de 31 mois est dans la classe des 2 à 3 ans', () => {
    const classes = pyramideDesAges([animal('2024-03-01')], '2026-10-16');
    expect(classes.find((c) => c.cle === 'de2a3')).toMatchObject({ femelles: 1 });
  });
});

describe('mouvements de l’année', () => {
  const ligne = (cause: string, entrees: [number, number, number], sorties: [number, number, number]): LigneMouvement => ({
    date: '2026-03-01',
    cause,
    entrees: { jeunes: entrees[0], femelles: entrees[1], males: entrees[2] },
    sorties: { jeunes: sorties[0], femelles: sorties[1], males: sorties[2] },
  });

  it('sépare naissances, achats, ventes, morts et autres sorties, sans les changements de catégorie', () => {
    const m = mouvementsDeLAnnee({
      lignes: [
        ligne('N', [5, 0, 0], [0, 0, 0]),
        ligne('A', [0, 2, 1], [0, 0, 0]),
        ligne('V', [0, 0, 0], [3, 1, 0]),
        ligne('M', [0, 0, 0], [1, 1, 0]),
        ligne('AU', [0, 0, 0], [0, 0, 1]),
        ligne('C', [0, 4, 0], [4, 0, 0]),
      ],
    });
    expect(m).toEqual({ naissances: 5, achats: 3, ventes: 4, morts: 2, autresSorties: 1 });
  });
});
