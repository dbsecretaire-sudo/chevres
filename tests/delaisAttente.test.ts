import { describe, expect, it } from 'vitest';
import {
  ajouterJours,
  animauxEnDelai,
  delaisDeLAnimal,
  delaisEnCours,
  finDuDelai,
  finLaPlusTardive,
  traitementConcerne,
} from '@/features/exploitation/services/delaisAttente';
import type { Chevre } from '@/features/cheptel/types';
import type { Traitement } from '@/features/exploitation/types';

const traitement = (extra: Partial<Traitement> = {}): Traitement => ({
  id: 't',
  date: '2026-03-01',
  produit: 'Amoxicilline',
  delaiLaitJours: 7,
  delaiViandeJours: 28,
  ...extra,
});
const animal = (boucle: string, extra: Partial<Chevre> = {}): Chevre =>
  ({ id: boucle, numeroBoucle: boucle, sexe: 'F', statut: 'vivante', dateNaissance: '2022-01-01', ...extra }) as unknown as Chevre;

describe('délais d’attente', () => {
  it('ajoute des jours, en passant les fins de mois et d’année', () => {
    expect(ajouterJours('2026-03-01', 7)).toBe('2026-03-08');
    expect(ajouterJours('2026-02-25', 7)).toBe('2026-03-04');
    expect(ajouterJours('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('la fin du délai part de la dernière prise (ou du début), pas du début du traitement', () => {
    expect(finDuDelai(traitement(), 'lait')).toBe('2026-03-08');
    expect(finDuDelai(traitement({ dateFin: '2026-03-05' }), 'lait')).toBe('2026-03-12');
    expect(finDuDelai(traitement({ dateFin: '2026-03-05' }), 'viande')).toBe('2026-04-02');
  });

  it('sans délai (absent ou zéro), rien', () => {
    expect(finDuDelai(traitement({ delaiLaitJours: undefined }), 'lait')).toBeUndefined();
    expect(finDuDelai(traitement({ delaiViandeJours: 0 }), 'viande')).toBeUndefined();
  });

  it('le dernier jour du délai compte encore, le lendemain non ; avant le début, rien', () => {
    const t = traitement();
    expect(delaisEnCours([t], '2026-03-08').map((d) => d.type)).toEqual(['viande', 'lait']);
    expect(delaisEnCours([t], '2026-03-09').map((d) => d.type)).toEqual(['viande']);
    expect(delaisEnCours([t], '2026-04-06')).toEqual([]);
    expect(delaisEnCours([t], '2026-02-28')).toEqual([]);
  });

  it('un traitement concerne la boucle nommée, ou tout le troupeau quand il n’en nomme aucune', () => {
    expect(traitementConcerne({ chevreNumeroBoucle: '10001, 10002' }, '10002')).toBe(true);
    expect(traitementConcerne({ chevreNumeroBoucle: '10001, 10002' }, '10003')).toBe(false);
    expect(traitementConcerne({ chevreNumeroBoucle: '' }, '10003')).toBe(true);
    expect(traitementConcerne({}, undefined)).toBe(true);
  });

  it('pour un animal, le délai qui finit le plus tard l’emporte, par type', () => {
    const court = traitement({ id: 'a', delaiLaitJours: 3, delaiViandeJours: 10 });
    const long = traitement({ id: 'b', date: '2026-03-02', delaiLaitJours: 6, delaiViandeJours: 5 });
    const delais = delaisDeLAnimal('10001', [court, long], '2026-03-03');
    expect(delais.lait?.traitement.id).toBe('b');
    expect(delais.viande?.traitement.id).toBe('a');
    expect(delaisDeLAnimal('10001', [], '2026-03-03')).toEqual({});
  });

  it('les animaux en délai de lait : les femelles vivantes traitées seulement', () => {
    const animaux = [
      animal('10001'),
      animal('10002'),
      animal('10003', { sexe: 'M' }),
      animal('10004', { statut: 'morte' }),
    ];
    const t = traitement({ chevreNumeroBoucle: '10001, 10003, 10004' });
    expect(animauxEnDelai(animaux, [t], '2026-03-05', 'lait').map((a) => a.animal.numeroBoucle)).toEqual(['10001']);
    // La viande : les mâles aussi, mais pas les morts.
    expect(animauxEnDelai(animaux, [t], '2026-03-05', 'viande').map((a) => a.animal.numeroBoucle)).toEqual(['10001', '10003']);
  });

  it('un traitement du troupeau entier met toutes les femelles en délai', () => {
    const animaux = [animal('10001'), animal('10002')];
    expect(animauxEnDelai(animaux, [traitement({ chevreNumeroBoucle: '' })], '2026-03-05', 'lait')).toHaveLength(2);
  });

  it('la fin la plus tardive d’une liste de délais', () => {
    expect(finLaPlusTardive([{ fin: '2026-03-08' }, { fin: '2026-04-01' }, { fin: '2026-03-30' }])).toBe('2026-04-01');
    expect(finLaPlusTardive([])).toBeUndefined();
  });
});
