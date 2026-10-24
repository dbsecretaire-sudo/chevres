import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/features/comptabilite/services/transactions';
import type { Facture } from '@/features/comptabilite/types';
import { ecrituresEquarrissagePayeesParUnAutre, facturesPayeesPourLEquarrisseur } from '@/features/exploitation/services/partenaires';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import type { Fournisseur } from '@/features/fournisseurs/types';

const atm = { id: 'atm', nomEntreprise: 'ATM', categorie: CATEGORIE_FOURNISSEUR.EQUARRISSAGE } as Fournisseur;
const chambre = {
  id: 'f1',
  type: TYPE_FACTURE.RECUE,
  tiers: 'Chambre d’agriculture',
  date: '2026-03-01',
  montant: 500,
  description: '',
  lignesChambre: [
    { libelle: 'Équarrissage ATM 2026', montant: 442.07, equarrisseurId: 'atm' },
    { libelle: 'Forfait identification', montant: 57.93 },
  ],
} as unknown as Facture;

describe('les factures payées à la Chambre d’agriculture pour le compte d’un équarrisseur', () => {
  it('l’équarrisseur a la facture, pour le montant de ses lignes seulement', () => {
    const parts = facturesPayeesPourLEquarrisseur(atm, [chambre], false);
    expect(parts).toHaveLength(1);
    expect(parts[0].montant).toBeCloseTo(442.07);
  });

  it('un autre équarrisseur ne l’a pas', () => {
    const autre = { ...atm, id: 'autre', nomEntreprise: 'Autre' } as Fournisseur;
    expect(facturesPayeesPourLEquarrisseur(autre, [chambre], false)).toEqual([]);
  });

  it('la page Équarrissage montre l’écriture de la facture, pour le montant de ses lignes d’équarrissage', () => {
    const transaction = { id: 'f1', date: '2026-03-01', montant: 500, montantActivite: 500, montantComptabilise: 500, titre: 'Chambre d’agriculture', sousTitre: '', sens: 'sortie' } as unknown as Transaction;
    const ecritures = ecrituresEquarrissagePayeesParUnAutre([transaction], [chambre], []);
    expect(ecritures).toHaveLength(1);
    expect(ecritures[0].montantComptabilise).toBeCloseTo(442.07);
    // Déjà dans la liste : pas deux fois.
    expect(ecrituresEquarrissagePayeesParUnAutre([transaction], [chambre], [{ id: 'f1' }])).toEqual([]);
  });
});

