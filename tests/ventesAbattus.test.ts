import { describe, expect, it } from 'vitest';
import { joursAbattusAFacturer } from '@/features/comptabilite/utils/animauxVendus';
import type { Chevre } from '@/features/cheptel/types';

const abattu = (id: string, jour: string): Chevre =>
  ({ id, sexe: 'M', statut: 'abattoir', dateStatut: jour, dateNaissance: '2026-01-01', numeroBoucle: id }) as unknown as Chevre;

describe('ventes d’animaux abattus', () => {
  it('une vente supprimée remet ses animaux abattus dans les animaux à facturer', () => {
    const animaux = [abattu('a', '2026-02-25'), abattu('b', '2026-02-25'), abattu('c', '2026-03-10')];
    const ventes = [{ id: 'v1', animaux: 'a;b' }];
    expect(joursAbattusAFacturer(animaux, ventes).map((j) => j.date)).toEqual(['2026-03-10']);
    // La vente supprimée : le jour d'abattage revient, avec ses deux animaux.
    const apres = joursAbattusAFacturer(animaux, []);
    expect(apres.map((j) => [j.date, j.animaux.length])).toEqual([
      ['2026-03-10', 1],
      ['2026-02-25', 2],
    ]);
  });
});
