import { describe, expect, it } from 'vitest';
import { coutsParFormule } from '@/features/commercial/services/coutsAgritourisme';
import type { FormuleAgritourisme, VisiteAgritourisme } from '@/features/commercial/types';
import {
  coutCarburantDeLaVisite,
  precocherFraisTouristiques,
} from '@/features/comptabilite/services/fraisTouristiques';
import type { Facture } from '@/features/comptabilite/types';
import type { Vehicule } from '@/features/settings/settings';
import { depensesAgritourisme } from '@/features/accueil/services/agritourismeFerme';
import { ateliersDesVentesDeViande } from '@/features/comptabilite/services/rentabilite';
import { ATELIER, ATELIER_PAR_CATEGORIE_VENTE } from '@/shared/constants/ateliers';
import { CATEGORIE_DEPENSE, CATEGORIE_VENTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

describe('les frais touristiques se rangent d’office', () => {
  it('pour l’office de tourisme, un partenaire, le repas et un véhicule touristique', () => {
    expect(precocherFraisTouristiques({ categorieFournisseur: CATEGORIE_FOURNISSEUR.TOURISME })).toBe(true);
    expect(precocherFraisTouristiques({ categorieFournisseur: CATEGORIE_FOURNISSEUR.REPAS })).toBe(true);
    expect(precocherFraisTouristiques({ vehicule: { usageTouristique: true } })).toBe(true);
    expect(precocherFraisTouristiques({ categorieFournisseur: CATEGORIE_FOURNISSEUR.GARAGE })).toBe(false);
    expect(precocherFraisTouristiques({ vehicule: { usageTouristique: false } })).toBe(false);
    expect(precocherFraisTouristiques({})).toBe(false);
  });
});

describe('carburant d’une visite', () => {
  it('kilomètres en charge × consommation × prix du litre', () => {
    expect(coutCarburantDeLaVisite({ km: 40, consommation: 10, prixLitre: 1.8 })).toBe(7.2);
    expect(coutCarburantDeLaVisite({ km: 40, consommation: 10 })).toBeUndefined();
    expect(coutCarburantDeLaVisite({ km: 0, consommation: 10, prixLitre: 1.8 })).toBeUndefined();
  });
});

describe('coût par visite avec les frais touristiques', () => {
  const formule: FormuleAgritourisme = {
    id: 'f1',
    nom: 'Visite 4x4',
    prix: 30,
    elements: [],
    vehiculeId: 'v4',
    km: 40,
  };
  const visite = (id: string, date: string): VisiteAgritourisme => ({
    id,
    date,
    client: 'Groupe',
    formuleId: 'f1',
    formule: 'Visite 4x4',
    participants: 8,
    prixParPersonne: 30,
    statut: 'realisee',
  });
  const facture = (id: string, montant: number, extra: Partial<Facture>): Facture =>
    ({
      id,
      date: '2026-03-01',
      type: TYPE_FACTURE.RECUE,
      tiers: 'Office',
      description: 'Frais',
      montant,
      ...extra,
    }) as Facture;
  const vehicule = {
    id: 'v4',
    plaque: 'AB-123-CD',
    actif: true,
    usageTouristique: true,
    consommation: 10,
    prixCarburant: 1.8,
  } as Vehicule;

  it('les factures cochées et le carburant calculé s’additionnent, par visite', () => {
    const couts = coutsParFormule({
      visites: [visite('a', '2026-05-01'), visite('b', '2026-06-01')],
      formules: [formule],
      elements: [],
      factures: [
        facture('f-assurance', 200, {
          atelier: ATELIER.AGRITOURISME,
          categorieDepense: CATEGORIE_DEPENSE.ASSURANCES,
          description: 'Assurance accueil du public',
        }),
        facture('f-flyers', 60, {
          atelier: ATELIER.AGRITOURISME,
          categorieDepense: CATEGORIE_DEPENSE.PUBLICITE,
          description: 'Flyers',
        }),
        // Une charge qui n'est pas cochée ne compte pas.
        facture('f-commune', 500, {}),
      ],
      horsTaxes: false,
      vehicules: [vehicule],
    });
    const c = couts.formules[0];
    // (200 + 60) ÷ 2 visites + 40 km × 10 L/100 × 1,8 € = 130 + 7,2
    expect(c.coutParVisite).toBe(137.2);
    expect(c.composants.map((x) => x.libelle)).toEqual([undefined, 'Carburant AB-123-CD']);
    expect(couts.total).toBe(274.4);
  });

  it('sans véhicule renseigné, pas de carburant calculé', () => {
    const couts = coutsParFormule({
      visites: [visite('a', '2026-05-01')],
      formules: [formule],
      elements: [],
      factures: [],
      horsTaxes: false,
      vehicules: [{ ...vehicule, consommation: undefined }],
    });
    expect(couts.formules[0].composants).toEqual([]);
    expect(couts.total).toBe(0);
  });
});

describe('dépenses de l’agritourisme et ateliers de ce qu’on fabrique', () => {
  it('les dépenses de la plaque sont les factures reçues rangées dans l’atelier Agritourisme', () => {
    const f = (type: string, atelier: string | undefined, montant: number) =>
      ({ type, atelier, montant }) as never;
    expect(
      depensesAgritourisme([
        f(TYPE_FACTURE.RECUE, ATELIER.AGRITOURISME, 20),
        f(TYPE_FACTURE.RECUE, ATELIER.AGRITOURISME, 5.5),
        f(TYPE_FACTURE.RECUE, undefined, 100),
        f(TYPE_FACTURE.EMISE, ATELIER.AGRITOURISME, 300),
      ]),
    ).toBe(25.5);
  });

  it('un plat préparé vendu forme son atelier, un savon aussi ', () => {
    const ventes = [{ id: 'v1' }, { id: 'v2' }] as never[];
    const ateliers = ateliersDesVentesDeViande(
      ventes,
      () => undefined,
      (v) => ((v as { id: string }).id === 'v1' ? 'plat:civet' : 'viande:saucisson'),
    );
    expect(ateliers).toEqual({ v1: ATELIER.PLATS });
    expect(ATELIER_PAR_CATEGORIE_VENTE[CATEGORIE_VENTE.SAVONS]).toBe(ATELIER.SAVONS);
  });
});
