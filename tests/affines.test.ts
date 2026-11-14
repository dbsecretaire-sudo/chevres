import { describe, expect, it } from 'vitest';
import { affinesPossibles, fromagesAffinables } from '@/features/production/services/affines';
import type { ArchiveStock } from '@/features/stock/types';

/** Un affiné dont la recette prend 1 frais par pièce, et le sel (qui n'est pas un fromage). */
const archive = {
  unites: {},
  recettes: [
    {
      id: 'r',
      nom: 'Affiné',
      produit: 'fromage',
      article: 'fromage:affine',
      ingredients: [
        { article: 'fromage:frais', quantite: 1 },
        { article: 'sel', quantite: 2 },
      ],
    },
  ],
  lots: [],
} as unknown as ArchiveStock;

describe('affinés : le nombre se déduit des lots de fromage frais cochés', () => {
  it('ne prend que les fromages de la recette, pas le sel', () => {
    expect(fromagesAffinables(archive, 'fromage', 'fromage:affine').map((f) => f.article)).toEqual(['fromage:frais']);
  });

  it('autant d’affinés que de lots frais cochés, pour une pièce par fromage', () => {
    expect(affinesPossibles(archive, 'fromage', 'fromage:affine', {})).toBe(0);
    expect(affinesPossibles(archive, 'fromage', 'fromage:affine', { 'fromage:frais': ['a', 'b', 'c'] })).toBe(3);
  });

  it('sans rien de coché, ou sans archive, il n’y en a aucun', () => {
    expect(affinesPossibles(null, 'fromage', 'fromage:affine', { 'fromage:frais': ['a'] })).toBe(0);
    expect(affinesPossibles(archive, 'fromage', '', { 'fromage:frais': ['a'] })).toBe(0);
  });
});
