import { describe, expect, it } from 'vitest';
import { joursAbattusAFacturer } from '@/features/comptabilite/utils/animauxVendus';
import type { Chevre } from '@/features/cheptel/types';

const animal = (id: string, statut: string, dateStatut?: string, numeroBoucle = id): Chevre =>
  ({ id, statut, dateStatut, numeroBoucle, sexe: 'F', dateNaissance: '2026-01-01' }) as unknown as Chevre;

describe('animaux abattus à facturer', () => {
  it('les animaux à l’abattoir, rangés par jour d’abattage, le plus récent d’abord', () => {
    const jours = joursAbattusAFacturer(
      [
        animal('b', 'abattoir', '2026-03-10'),
        animal('a', 'abattoir', '2026-03-10'),
        animal('c', 'abattoir', '2026-04-02'),
        animal('d', 'vivante'),
        animal('e', 'morte', '2026-03-10'),
      ],
      [],
    );
    expect(jours.map((j) => [j.date, j.animaux.map((a) => a.id)])).toEqual([
      ['2026-04-02', ['c']],
      ['2026-03-10', ['a', 'b']],
    ]);
  });

  it('les animaux déjà désignés par une vente ne sont plus à facturer, sauf ceux de la vente qu’on modifie', () => {
    const animaux = [animal('a', 'abattoir', '2026-03-10'), animal('b', 'abattoir', '2026-03-10')];
    const ventes = [{ id: 'v1', animaux: 'a' }];
    expect(joursAbattusAFacturer(animaux, ventes)[0].animaux.map((x) => x.id)).toEqual(['b']);
    expect(joursAbattusAFacturer(animaux, ventes, 'v1')[0].animaux.map((x) => x.id)).toEqual(['a', 'b']);
    expect(joursAbattusAFacturer(animaux, [{ id: 'v1', animaux: 'a;b' }])).toEqual([]);
  });
});
