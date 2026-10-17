import { describe, expect, it } from 'vitest';
import { effectifsDesAnimaux } from '@/features/cheptel/repository/chevres';
import { niveauxDeStock } from '@/features/stock/services/stock';
import type { Chevre } from '@/features/cheptel/types';

const animal = (id: string, extra: Partial<Chevre>): Chevre =>
  ({ id, espece: 'chevres', sexe: 'F', statut: 'vivante', dateNaissance: '2020-01-01', numeroBoucle: id, ...extra }) as unknown as Chevre;

describe('stock de viande : les animaux à l’abattoir pas encore facturés', () => {
  const animaux = [
    animal('a', { statut: 'vivante' }), // adulte vivante
    animal('b', { statut: 'abattoir', dateStatut: '2026-02-25', dateNaissance: '2025-12-14', sexe: 'M' }), // cabri à l'abattoir, à facturer
    animal('c', { statut: 'abattoir', dateStatut: '2026-02-25', dateNaissance: '2025-12-20', sexe: 'M' }), // cabri déjà facturé
    animal('d', { statut: 'abattoir', dateStatut: '2026-02-25', dateNaissance: '2019-01-01' }), // chèvre à l'abattoir, à facturer
    animal('t', { statut: 'abattoir', dateStatut: '2026-02-25', dateNaissance: '2019-01-01', numeroBoucle: '60001' }), // un tiptag : un cabri
  ];

  it('sans les ventes, seuls les vivants comptent', () => {
    const e = effectifsDesAnimaux(animaux).chevres;
    expect(e).toMatchObject({ petits: 0, sevres: 1, femelles: 1 });
  });

  it('un cabri (ou un tiptag) à l’abattoir à facturer compte dans les cabris, une chèvre dans « Chèvre sur pied » ; un animal facturé ne compte plus', () => {
    const effectifs = effectifsDesAnimaux(animaux, new Set(['c']), new Set(['60001']));
    expect(effectifs.chevres).toMatchObject({ petits: 2, aFacturerAdultes: 1, femelles: 1 });
    const niveaux = niveauxDeStock([], effectifs);
    expect(niveaux.get('viande:chevres_jeune')).toBe(2);
    // « Chèvre sur pied » : seulement les chèvres mortes à l'abattoir, pas encore facturées ; « Chèvre vivante » : les femelles vivantes.
    expect(niveaux.get('viande:chevres_pied')).toBe(1);
    expect(niveaux.get('viande:chevres_vivant')).toBe(1);
  });
});
