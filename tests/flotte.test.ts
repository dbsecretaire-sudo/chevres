import { describe, expect, it } from 'vitest';
import {
  assuranceEnCours,
  categorieAvecVehicule,
  primesDuVehicule,
  enregistrerVehicule,
  libelleVehicule,
  normaliserPlaque,
  plaqueDejaUtilisee,
  vehiculesProposes,
  vehiculesTries,
} from '@/features/exploitation/services/flotte';
import type { Facture } from '@/features/comptabilite/types';
import type { Vehicule } from '@/features/settings/settings';

const v = (id: string, plaque: string, actif = true): Vehicule => ({ id, plaque, actif });

describe('la flotte', () => {
  it('la plaque s’enregistre en majuscules, sans espaces en trop', () => {
    expect(normaliserPlaque('  ab-123-cd ')).toBe('AB-123-CD');
    expect(enregistrerVehicule([], { plaque: 'ab 123 cd', actif: true })[0].plaque).toBe('AB 123 CD');
  });

  it('un véhicule de même identifiant est remplacé, un autre est ajouté', () => {
    let flotte = enregistrerVehicule(undefined, { id: 'a', plaque: 'AA-111-AA', actif: true });
    flotte = enregistrerVehicule(flotte, { id: 'a', plaque: 'AA-111-AA', actif: false });
    flotte = enregistrerVehicule(flotte, { id: 'b', plaque: 'BB-222-BB', actif: true });
    expect(flotte.map((x) => [x.id, x.actif])).toEqual([['a', false], ['b', true]]);
  });

  it('les actifs d’abord ; une écriture ne propose que les actifs, et garde son véhicule devenu inactif', () => {
    const flotte = [v('a', 'BB-222-BB', false), v('b', 'CC-333-CC'), v('c', 'AA-111-AA')];
    expect(vehiculesTries(flotte).map((x) => x.id)).toEqual(['c', 'b', 'a']);
    expect(vehiculesProposes(flotte).map((x) => x.id)).toEqual(['c', 'b']);
    expect(vehiculesProposes(flotte, 'a').map((x) => x.id)).toEqual(['c', 'b', 'a']);
  });

  it('la plaque est unique, sauf pour le véhicule qu’on modifie', () => {
    const flotte = [v('a', 'AA-111-AA')];
    expect(plaqueDejaUtilisee(flotte, 'aa-111-aa')).toBe(true);
    expect(plaqueDejaUtilisee(flotte, 'aa-111-aa', 'a')).toBe(false);
  });

  it('le libellé : la plaque, puis la marque et le modèle', () => {
    expect(libelleVehicule({ ...v('a', 'AA-111-AA'), marque: 'Toyota', modele: 'Hilux' })).toBe('AA-111-AA · Toyota Hilux');
    expect(libelleVehicule(v('a', 'AA-111-AA'))).toBe('AA-111-AA');
  });
});

describe('les écritures qui se lient à un véhicule', () => {
  it('une réparation, une assurance dont l’objet est un véhicule, l’indemnité de l’assurance', () => {
    expect(categorieAvecVehicule('reparation')).toBe(true);
    expect(categorieAvecVehicule('assurances', undefined, 'vehicule')).toBe(true);
    expect(categorieAvecVehicule(undefined, 'assurance_vehicule')).toBe(true);
  });

  it('une assurance des bâtiments ou des animaux, ou sans objet, ne demande pas de véhicule', () => {
    expect(categorieAvecVehicule('assurances', undefined, 'batiments')).toBe(false);
    expect(categorieAvecVehicule('assurances', undefined, 'animaux')).toBe(false);
    expect(categorieAvecVehicule('assurances')).toBe(false);
    expect(categorieAvecVehicule('alimentation')).toBe(false);
  });
});

describe('l’assurance en cours d’un véhicule', () => {
  const prime = (id: string, date: string, vehiculeId = 'v1', tiers = 'Assureur'): Facture =>
    ({ id, date, type: 'recue', tiers, description: '', montant: 100, categorieDepense: 'assurances', vehiculeId }) as Facture;

  it('sans prime, le véhicule n’est pas assuré ; avec une prime, il l’est chez son assureur', () => {
    expect(assuranceEnCours({ id: 'v1' }, [])).toBeUndefined();
    expect(assuranceEnCours({ id: 'v1' }, [prime('a', '2026-01-10')])?.tiers).toBe('Assureur');
  });

  it('ne compte que les primes du véhicule, la plus récente d’abord', () => {
    const factures = [prime('a', '2026-01-10'), prime('b', '2026-06-10'), prime('c', '2026-09-10', 'v2')];
    expect(primesDuVehicule(factures, 'v1').map((f) => f.id)).toEqual(['b', 'a']);
  });

  it('résilié, il n’est plus assuré ; une prime payée après la résiliation le rend de nouveau assuré', () => {
    const resilie = { id: 'v1', assuranceResilieeLe: '2026-07-01' };
    expect(assuranceEnCours(resilie, [prime('a', '2026-06-10')])).toBeUndefined();
    expect(assuranceEnCours(resilie, [prime('a', '2026-06-10'), prime('b', '2026-08-01', 'v1', 'Autre')])?.tiers).toBe('Autre');
  });
});
