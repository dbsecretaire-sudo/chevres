import { describe, expect, it } from 'vitest';
import { ateliersDesVentesDeViande, calculerRentabilite } from '@/features/comptabilite/services/rentabilite';
import { ateliersDeLEspece, ATELIER } from '@/shared/constants/ateliers';
import { TOUTES_ACTIVITES } from '@/features/comptabilite/services/filtresTransactions';
import type { Vente } from '@/features/comptabilite/types';

const vente = (id: string, categorie: string, prix: number, precision?: string): Vente =>
  ({ id, date: '2026-02-26', categorie, quantite: 1, unite: 'piece', prix, precision }) as unknown as Vente;

describe('l’atelier d’une vente de viande', () => {
  const ventes = [vente('c', 'viande', 1505.66, 'Cabris'), vente('p', 'viande', 300, 'Chèvre sur pied'), vente('s', 'boucherie_charcuterie', 100)];
  const roles: Record<string, string | undefined> = { c: 'jeune', p: 'pied', s: undefined };

  it('les cabris forment leur atelier, l’animal sur pied ou vivant celui des reproducteurs et réformes, la charcuterie reste à la viande', () => {
    expect(ateliersDesVentesDeViande(ventes, (v) => roles[v.id])).toEqual({ c: ATELIER.PETITS, p: ATELIER.ANIMAUX });
  });

  it('la marge par atelier suit : les recettes des cabris ne sont plus dans la boucherie', () => {
    const r = calculerRentabilite({
      annee: 2026,
      ventes,
      factures: [],
      filtre: TOUTES_ACTIVITES,
      horsTaxes: false,
      ateliersDesVentes: ateliersDesVentesDeViande(ventes, (v) => roles[v.id]),
    });
    const recettes = Object.fromEntries(r.ateliers.map((a) => [a.atelier, a.recettes]));
    expect(recettes[ATELIER.PETITS]).toBe(1505.66);
    expect(recettes[ATELIER.ANIMAUX]).toBe(300);
    expect(recettes[ATELIER.VIANDE]).toBe(100);
  });
});

describe('les ateliers proposés pour une charge', () => {
  it('pas d’œufs pour des chèvres ; que des œufs, de la viande… pour des poules', () => {
    expect(ateliersDeLEspece('chevres')).not.toContain(ATELIER.OEUFS);
    expect(ateliersDeLEspece('chevres')).toContain(ATELIER.LAIT);
    expect(ateliersDeLEspece('poules')).toContain(ATELIER.OEUFS);
    expect(ateliersDeLEspece('poules')).not.toContain(ATELIER.LAIT);
  });
});
