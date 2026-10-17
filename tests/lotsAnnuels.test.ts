import { describe, expect, it } from 'vitest';
import {
  ajouterAuLotAnnuel,
  anneeDeLotPrise,
  anneeDuLot,
  avecAnnee,
  chevresAyantAvorte,
  lotsAnnuelsDeLAnimal,
  lotsDAvortementDeLAnnee,
  nomDuLotAnnuel,
  peutRejoindreLeLot,
  peutRejoindreLeLotDeLAnnee,
} from '@/features/exploitation/services/lotsAnnuels';
import { resultatsDeLAnnee } from '@/features/export/carnetMiseBasPdf';
import type { LotAnimaux } from '@/features/settings/settings';
import type { Chevre } from '@/features/cheptel/types';

const animal = (boucle: string, extra: Partial<Chevre> = {}): Chevre =>
  ({ id: boucle, sexe: 'F', statut: 'vivante', dateNaissance: '2022-03-01', numeroBoucle: boucle, ...extra }) as unknown as Chevre;

describe('lots d’une année (avortements, mises à la reproduction, renouvellement)', () => {
  it('ajoute une boucle au lot de l’année, créé s’il manque, sans doublon', () => {
    let n = 0;
    const premier = ajouterAuLotAnnuel([], 'avortement', 2026, '10', () => 'id' + ++n);
    expect(premier.lot).toMatchObject({ nom: 'Avortements 2026', boucles: '10', categorie: 'avortement', avortement: 2026 });
    const second = ajouterAuLotAnnuel(premier.lots, 'avortement', 2026, '05');
    expect(second.lots).toHaveLength(1);
    expect(second.lot.boucles).toBe('05, 10');
    // Une boucle déjà là : rien ne change.
    expect(ajouterAuLotAnnuel(second.lots, 'avortement', 2026, '10').lots).toBe(second.lots);
    // Une autre catégorie, un autre lot.
    const renouvellement = ajouterAuLotAnnuel(second.lots, 'renouvellement', 2026, '10');
    expect(renouvellement.lots).toHaveLength(2);
    expect(renouvellement.lot).toMatchObject({ nom: 'Renouvellement 2026', renouvellement: 2026 });
  });

  it('l’année d’un lot se change, son nom la suit, deux lots n’ont pas la même année', () => {
    const lot: LotAnimaux = { id: 'a', nom: 'Avortements 2026', boucles: '1', categorie: 'avortement', avortement: 2026 };
    const autre: LotAnimaux = { id: 'b', nom: 'Avortements 2025', boucles: '2', categorie: 'avortement', avortement: 2025 };
    expect(avecAnnee(lot, 2027)).toMatchObject({ nom: 'Avortements 2027', avortement: 2027 });
    expect(anneeDuLot(avecAnnee(lot, 2027))).toBe(2027);
    expect(anneeDeLotPrise([lot, autre], lot, 2025)).toBe(true);
    expect(anneeDeLotPrise([lot, autre], lot, 2024)).toBe(false);
    expect(nomDuLotAnnuel('reproduction', 2024)).toBe('Mises à la reproduction 2024');
  });

  it('les lots d’une année d’un animal, pour ses labels (les plus récents d’abord)', () => {
    const lots: LotAnimaux[] = [
      { id: 'a', nom: 'Avortements 2025', boucles: '1, 2', categorie: 'avortement', avortement: 2025 },
      { id: 'b', nom: 'Renouvellement 2026', boucles: '1', categorie: 'renouvellement', renouvellement: 2026 },
      { id: 'c', nom: 'Visite vétérinaire du 01/01/2026', boucles: '1', categorie: 'veterinaire' },
    ];
    expect(lotsAnnuelsDeLAnimal(lots, '1').map((l) => l.nom)).toEqual(['Renouvellement 2026', 'Avortements 2025']);
    expect(lotsAnnuelsDeLAnimal(lots, '2').map((l) => l.nom)).toEqual(['Avortements 2025']);
    expect(lotsAnnuelsDeLAnimal(lots, undefined)).toEqual([]);
  });

  it('qui peut rejoindre quel lot : tout animal avec boucle au renouvellement ; une femelle de plus de 6 mois à la reproduction et aux avortements', () => {
    const jour = '2026-10-17';
    expect(peutRejoindreLeLot('renouvellement', animal('1', { sexe: 'M', dateNaissance: '2026-08-01' }), jour)).toBe(true);
    expect(peutRejoindreLeLot('avortement', animal('1'), jour)).toBe(true);
    expect(peutRejoindreLeLot('reproduction', animal('1'), jour)).toBe(true);
    expect(peutRejoindreLeLot('avortement', animal('1', { sexe: 'M' }), jour)).toBe(false);
    expect(peutRejoindreLeLot('reproduction', animal('1', { dateNaissance: '2026-08-01' }), jour)).toBe(false);
    expect(peutRejoindreLeLot('renouvellement', animal('1', { numeroBoucle: ' ' }), jour)).toBe(false);
    expect(peutRejoindreLeLot('avortement', animal('1', { statut: 'morte' }), jour)).toBe(false);
  });

  it('le lot d’avortements de l’année courante se crée vide ; le carnet en reprend le nombre', () => {
    const lots = lotsDAvortementDeLAnnee([], 2026, () => 'x') as LotAnimaux[];
    expect(lots).toHaveLength(1);
    expect(lots[0]).toMatchObject({ nom: 'Avortements 2026', boucles: '', avortement: 2026 });
    expect(lotsDAvortementDeLAnnee(lots, 2026)).toBeNull();
    // Sans lot pour l'année : rien (à écrire à la main) ; avec un lot vide : 0 ; avec des femelles : leur nombre.
    expect(chevresAyantAvorte(lots, 2025)).toBeUndefined();
    expect(chevresAyantAvorte(lots, 2026)).toBe(0);
    const avec = [{ ...lots[0], boucles: '1, 2, 2' }];
    expect(chevresAyantAvorte(avec, 2026)).toBe(2);
    const portee = { date: '2026-03-01', mereNumeroBoucle: '1', cabrits: [animal('100', { dateNaissance: '2026-03-01' })] };
    expect(resultatsDeLAnnee([portee], 2026, 10, chevresAyantAvorte(avec, 2026)).avortements).toBe(2);
    expect(resultatsDeLAnnee([portee], 2026, 10).avortements).toBeUndefined();
  });
});

describe('femelles proposées au lot d’une année', () => {
  it('une chèvre née en décembre 2021 est proposée pour 2022 (6 mois en juin), même morte depuis', () => {
    const nee = animal('20015', { dateNaissance: '2021-12-19', statut: 'morte', dateStatut: '2025-08-01' });
    expect(peutRejoindreLeLotDeLAnnee(nee, 2022)).toBe(true);
    expect(peutRejoindreLeLotDeLAnnee(nee, 2021)).toBe(false);
    // Sortie en cours d'année : seulement si elle avait déjà 6 mois ce jour-là.
    expect(peutRejoindreLeLotDeLAnnee(animal('1', { dateNaissance: '2021-12-19', statut: 'morte', dateStatut: '2022-03-01' }), 2022)).toBe(false);
    expect(peutRejoindreLeLotDeLAnnee(animal('2', { dateNaissance: '2021-12-19', statut: 'morte', dateStatut: '2022-09-01' }), 2022)).toBe(true);
    // Sortie avant l'année, mâle, sans boucle, ou née trop tard : non.
    expect(peutRejoindreLeLotDeLAnnee(animal('3', { dateNaissance: '2020-01-01', statut: 'morte', dateStatut: '2021-06-01' }), 2022)).toBe(false);
    expect(peutRejoindreLeLotDeLAnnee(animal('4', { sexe: 'M', dateNaissance: '2020-01-01' }), 2022)).toBe(false);
    expect(peutRejoindreLeLotDeLAnnee(animal('5', { numeroBoucle: ' ', dateNaissance: '2020-01-01' }), 2022)).toBe(false);
    expect(peutRejoindreLeLotDeLAnnee(animal('6', { dateNaissance: '2022-08-01' }), 2022)).toBe(false);
    // 5 mois de gestation : née fin janvier, saillie à 6 mois fin juillet, mise bas en décembre ; née en février, c'est trop tard pour l'année.
    expect(peutRejoindreLeLotDeLAnnee(animal('7', { dateNaissance: '2022-01-20' }), 2022)).toBe(true);
    expect(peutRejoindreLeLotDeLAnnee(animal('8', { dateNaissance: '2022-02-10' }), 2022)).toBe(false);
  });
});
