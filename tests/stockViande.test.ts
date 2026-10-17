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
    animal('d', { statut: 'abattoir', dateStatut: '2026-02-25', dateNaissance: '2019-01-01' }), // adulte à l'abattoir, à facturer
  ];

  it('sans les ventes, seuls les vivants comptent (comme avant)', () => {
    const e = effectifsDesAnimaux(animaux).chevres;
    expect(e).toMatchObject({ petits: 0, sevres: 1, femelles: 1 });
  });

  it('un cabri à l’abattoir à facturer compte dans les cabris, un adulte dans « Chèvre sur pied » ; un animal facturé ne compte plus', () => {
    const effectifs = effectifsDesAnimaux(animaux, new Set(['c']));
    expect(effectifs.chevres).toMatchObject({ petits: 1, aFacturerAdultes: 1, femelles: 1 });
    const niveaux = niveauxDeStock([], effectifs);
    expect(niveaux.get('viande:chevres_jeune')).toBe(1);
    expect(niveaux.get('viande:chevres_pied')).toBe(2); // 1 femelle vivante + 1 adulte à facturer
    expect(niveaux.get('viande:chevres_vivant')).toBe(1);
  });
});
