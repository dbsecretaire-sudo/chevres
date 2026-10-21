import { describe, expect, it } from 'vitest';
import { calculerRentabilite } from '@/features/comptabilite/services/rentabilite';
import { ATELIER } from '@/shared/constants/ateliers';
import { TOUTES_ACTIVITES } from '@/features/comptabilite/services/filtresTransactions';
import type { Facture, Vente } from '@/features/comptabilite/types';

const vente = (id: string, categorie: string, prix: number): Vente =>
  ({ id, date: '2026-02-26', categorie, quantite: 1, unite: 'piece', prix }) as unknown as Vente;

const facture = (surcharge: Record<string, unknown>): Facture =>
  ({ id: 'f', type: 'recue', date: '2026-03-01', tiers: 'X', montant: 0, categorieDepense: 'autre', ...surcharge }) as unknown as Facture;

describe('la rentabilité limitée à des ateliers', () => {
  const ventes = [vente('f1', 'fromage', 1000), vente('v1', 'viande', 500)];
  const factures = [
    // L'agritourisme : une recette « autre » rangée dans son atelier, et une charge directe.
    facture({ id: 'r1', type: 'emise', categorieRecette: 'autre', atelier: ATELIER.AGRITOURISME, montant: 400 }),
    facture({ id: 'c1', atelier: ATELIER.AGRITOURISME, montant: 100 }),
    // Une charge du fromage, une charge commune, et une aide.
    facture({ id: 'c2', atelier: ATELIER.FROMAGE, montant: 200 }),
    facture({ id: 'c3', montant: 300 }),
    facture({ id: 'a1', type: 'emise', categorieRecette: 'aide', montant: 700 }),
  ];
  const base = { annee: 2026, ventes, factures, filtre: TOUTES_ACTIVITES, horsTaxes: false };

  it('sans limite : toute l’exploitation, aides comprises', () => {
    const r = calculerRentabilite(base);
    expect(r.recettes).toBe(1900);
    expect(r.aides).toBe(700);
    expect(r.charges).toBe(600);
  });

  it('l’agritourisme seul : ses recettes, ses charges directes et sa part des communes, sans les aides', () => {
    const r = calculerRentabilite({ ...base, perimetre: [ATELIER.AGRITOURISME] });
    expect(r.recettes).toBe(400);
    expect(r.aides).toBe(0);
    expect(r.ateliers.map((a) => a.atelier)).toEqual([ATELIER.AGRITOURISME]);
    // Direct : 100 ; communes 300 réparties au prorata des recettes (400 sur 1900).
    expect(r.ateliers[0].chargesDirectes).toBe(100);
    expect(r.ateliers[0].chargesCommunes).toBe(63.16);
    expect(r.postes.reduce((t, p) => t + p.montant, 0)).toBe(100);
  });

  it('ce qu’on fabrique : le fromage et la viande, sans l’agritourisme', () => {
    const r = calculerRentabilite({ ...base, perimetre: [ATELIER.LAIT, ATELIER.FROMAGE, ATELIER.VIANDE] });
    expect(r.recettes).toBe(1500);
    expect(r.ateliers.map((a) => a.atelier).sort()).toEqual([ATELIER.FROMAGE, ATELIER.VIANDE]);
    expect(r.resultat).toBe(r.recettes - r.charges);
  });
});
