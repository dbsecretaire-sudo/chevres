import { describe, expect, it } from 'vitest';
import {
  categorieAvecVehicule,
  enregistrerVehicule,
  libelleVehicule,
  normaliserPlaque,
  plaqueDejaUtilisee,
  vehiculesProposes,
  vehiculesTries,
} from '@/features/exploitation/services/flotte';
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
