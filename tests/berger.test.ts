import { describe, expect, it } from 'vitest';
import {
  animalDeLaBoucle,
  animalMort,
  annulerUneMort,
  annulerUneNaissance,
  enregistrerUneMort,
  enregistrerUneNaissance,
  nombresDePetits,
  petitsDuBerger,
} from '@/features/berger/services/saisies';
import { creerChevre, getChevre, listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { listNaissancesGroupees } from '@/features/cheptel/repository/naissances';
import { animauxACompleter, completee, libelleACompleter } from '@/features/cheptel/services/aCompleter';
import type { Chevre } from '@/features/cheptel/types';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';

const chevre = (extra: Partial<Chevre>): Chevre =>
  ({ id: 'a', sexe: SEXE.FEMELLE, dateNaissance: '2024-03-01', statut: STATUT_CHEVRE.VIVANTE, ...extra }) as Chevre;

describe('le berger : une naissance, une mort, c’est tout', () => {
  it('retrouve l’animal vivant qui porte la boucle scannée, pas un animal mort ni une autre boucle', () => {
    const animaux = [chevre({ id: 'a', numeroBoucle: '463' }), chevre({ id: 'b', numeroBoucle: '871', statut: STATUT_CHEVRE.MORTE })];
    expect(animalDeLaBoucle(animaux, ' 463 ')?.id).toBe('a');
    expect(animalDeLaBoucle(animaux, '871')).toBeUndefined();
    expect(animalDeLaBoucle(animaux, '999')).toBeUndefined();
  });

  it('propose de 1 petit jusqu’au maximum d’une mise bas', () => {
    expect(nombresDePetits(3)).toEqual([1, 2, 3]);
    expect(nombresDePetits(0)).toEqual([1]);
  });

  it('les petits sont marqués à compléter (leur sexe n’est pas connu)', () => {
    const petits = petitsDuBerger(2);
    expect(petits).toHaveLength(2);
    expect(petits.every((p) => p.aCompleter === true)).toBe(true);
  });

  it('un animal mort au scan : morte au jour donné, à compléter, et le reste de sa fiche ne change pas', () => {
    const mort = animalMort(chevre({ numeroBoucle: '463', nom: 'Bianca' }), '2026-10-24');
    expect(mort).toMatchObject({ statut: 'morte', dateStatut: '2026-10-24', aCompleter: true, numeroBoucle: '463', nom: 'Bianca' });
  });

  it('la liste à compléter dit ce qui a été saisi : la naissance avec sa mère, ou la mort', () => {
    expect(libelleACompleter(chevre({ dateNaissance: '2026-10-24', mereNumeroBoucle: '52' }))).toBe('Naissance du 24/10/2026 · mère 52');
    expect(libelleACompleter(chevre({ statut: STATUT_CHEVRE.MORTE, dateStatut: '2026-10-23' }))).toBe('Morte le 23/10/2026');
    expect(animauxACompleter([chevre({ id: 'x' }), chevre({ id: 'y', aCompleter: true, dateNaissance: '2026-01-01' }), chevre({ id: 'z', aCompleter: true, dateNaissance: '2026-05-01' })]).map((a) => a.id)).toEqual(['z', 'y']);
    expect(completee(chevre({ aCompleter: true })).aCompleter).toBeUndefined();
  });

  it('enregistre une naissance (petits nés le jour donné, de la mère) et l’annule', async () => {
    const mere = await creerChevre({ numeroBoucle: '12345', sexe: SEXE.FEMELLE, dateNaissance: '2022-02-02' });
    const petits = await enregistrerUneNaissance(mere, 2, '2026-10-24');
    expect(petits).toHaveLength(2);
    const portees = (await listNaissancesGroupees()).filter((p) => p.mereNumeroBoucle === '12345');
    expect(portees).toHaveLength(1);
    expect(portees[0]).toMatchObject({ date: '2026-10-24' });
    expect(portees[0].cabrits.every((c) => c.aCompleter && c.mereId === mere.id)).toBe(true);
    await annulerUneNaissance(petits);
    expect((await listNaissancesGroupees()).filter((p) => p.mereNumeroBoucle === '12345')).toHaveLength(0);
    expect(await getChevre(mere.id)).toBeTruthy();
  });

  it('enregistre une mort (à compléter) et l’annule : la chèvre redevient vivante comme avant', async () => {
    const animal = await creerChevre({ numeroBoucle: '54321', sexe: SEXE.FEMELLE, dateNaissance: '2021-01-01', nom: 'Rosa' });
    const avant = await enregistrerUneMort(animal, '2026-10-24');
    const morte = await getChevre(animal.id);
    expect(morte).toMatchObject({ statut: 'morte', dateStatut: '2026-10-24', aCompleter: true, nom: 'Rosa' });
    expect((await listChevresVivantes()).some((c) => c.id === animal.id)).toBe(false);
    await annulerUneMort(avant);
    const revenue = await getChevre(animal.id);
    expect(revenue).toMatchObject({ statut: 'vivante' });
    expect(revenue?.aCompleter).toBeUndefined();
  });
});
