import { beforeEach, describe, expect, it } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Facture } from '@/features/comptabilite/types';
import {
  choixApresCoche,
  estCategoriePartenaire,
  estPartenaire,
  facturesPartenaire,
  naturesDuPartenaire,
  sectionDuPartenaire,
} from '@/features/exploitation/services/partenaires';
import { CHOIX_PARTENAIRES_VIDE, choixLu } from '@/features/exploitation/repository/partenaires';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

const fournisseur = (id: string, nomEntreprise: string, categorie?: string): Fournisseur =>
  ({ id, nom: '', nomEntreprise, siret: '', adressePostale: '', categorie }) as unknown as Fournisseur;

const atm = fournisseur('atm', 'ATM', CATEGORIE_FOURNISSEUR.EQUARRISSAGE);
const msa = fournisseur('msa', 'MSA', CATEGORIE_FOURNISSEUR.ORGANISME);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('catégories de partenaires', () => {
  it('les catégories d’office sont des partenaires, pas les autres', () => {
    for (const c of [
      CATEGORIE_FOURNISSEUR.EQUARRISSAGE,
      CATEGORIE_FOURNISSEUR.ORGANISME,
      CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE,
      CATEGORIE_FOURNISSEUR.ASSUREUR,
    ])
      expect(estCategoriePartenaire(c, CHOIX_PARTENAIRES_VIDE)).toBe(true);
    expect(estCategoriePartenaire(CATEGORIE_FOURNISSEUR.GARAGE, CHOIX_PARTENAIRES_VIDE)).toBe(false);
  });

  it('une catégorie ajoutée est incluse, une catégorie retirée est exclue', () => {
    const ajoute = choixApresCoche(CHOIX_PARTENAIRES_VIDE, CATEGORIE_FOURNISSEUR.GARAGE, true);
    expect(estCategoriePartenaire(CATEGORIE_FOURNISSEUR.GARAGE, ajoute)).toBe(true);
    const retire = choixApresCoche(CHOIX_PARTENAIRES_VIDE, CATEGORIE_FOURNISSEUR.ORGANISME, false);
    expect(estCategoriePartenaire(CATEGORIE_FOURNISSEUR.ORGANISME, retire)).toBe(false);
    // Recocher une catégorie d'office efface l'écart : le choix d'office ne se note pas.
    expect(choixApresCoche(retire, CATEGORIE_FOURNISSEUR.ORGANISME, true)).toEqual(CHOIX_PARTENAIRES_VIDE);
  });

  it('le choix lu d’un stockage abîmé est vide', () => {
    expect(choixLu(undefined)).toEqual(CHOIX_PARTENAIRES_VIDE);
    expect(choixLu({ categoriesAjoutees: 'oups', categoriesRetirees: [1, 'a'] })).toEqual({
      categoriesAjoutees: [],
      categoriesRetirees: ['a'],
    });
  });

  it('un fournisseur est partenaire d’après sa catégorie', () => {
    expect(estPartenaire(atm, CHOIX_PARTENAIRES_VIDE)).toBe(true);
    expect(estPartenaire(fournisseur('g', 'Garage', CATEGORIE_FOURNISSEUR.GARAGE), CHOIX_PARTENAIRES_VIDE)).toBe(false);
  });
});

describe('sections et natures', () => {
  it('range chaque partenaire dans sa section, avec ses natures de contenu', () => {
    expect(sectionDuPartenaire(undefined)).toBe('groupements');
    expect(sectionDuPartenaire(atm)).toBe('equarrisseurs');
    expect(sectionDuPartenaire(msa)).toBe('organismes');
    expect(sectionDuPartenaire(fournisseur('a', 'Groupama', CATEGORIE_FOURNISSEUR.ASSUREUR))).toBe('assureurs');
    expect(naturesDuPartenaire(atm)).toContain('contrat');
    expect(naturesDuPartenaire(atm)).not.toContain('achat_groupe');
    expect(naturesDuPartenaire(undefined)).toContain('achat_groupe');
    // Chaque section propose le courrier / courriel.
    for (const f of [undefined, atm, msa]) expect(naturesDuPartenaire(f)).toContain('courrier_courriel');
  });
});

describe('factures d’un partenaire', () => {
  const recue = (plus: Partial<Facture>): Facture =>
    ({ id: 'f', date: '2026-02-01', type: 'recue', tiers: 'Autre', description: '', montant: 0, ...plus }) as unknown as Facture;

  it('reprend les lignes d’équarrissage des factures de la Chambre, avec le montant de ces lignes seulement', () => {
    const chambre = recue({
      id: 'ch1',
      tiers: 'Chambre d’agriculture',
      montant: 300,
      lignesChambre: [
        { libelle: 'Forfait conseil', montant: 100 },
        { libelle: 'Équarrissage ATM', montant: 200 },
      ],
    } as never);
    const resultat = facturesPartenaire(atm, [chambre], true, 'Équarrissage (Chambre)', 'Facture');
    expect(resultat).toEqual([{ id: 'ch1', description: 'Équarrissage (Chambre)', date: '2026-02-01', montant: 200 }]);
  });

  it('avec plusieurs équarrisseurs, une ligne non liée n’est à aucun d’eux', () => {
    const chambre = recue({
      id: 'ch2',
      tiers: 'Chambre',
      lignesChambre: [{ libelle: 'Équarrissage', montant: 50 }],
    } as never);
    expect(facturesPartenaire(atm, [chambre], false, 'x', 'Facture')).toEqual([]);
  });

  it('une ligne liée à un équarrisseur lui revient, même avec plusieurs', () => {
    const chambre = recue({
      id: 'ch3',
      tiers: 'Chambre',
      lignesChambre: [{ libelle: 'Équarrissage', montant: 50, equarrisseurId: 'atm' }],
    } as never);
    expect(facturesPartenaire(atm, [chambre], false, 'x', 'Facture')).toHaveLength(1);
    expect(facturesPartenaire(fournisseur('autre', 'Autre', CATEGORIE_FOURNISSEUR.EQUARRISSAGE), [chambre], false, 'x', 'Facture')).toEqual([]);
  });
});
