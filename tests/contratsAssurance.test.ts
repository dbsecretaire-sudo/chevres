import { describe, expect, it } from 'vitest';
import { periodiciteDeLEcart, propositionsDeContrats } from '@/features/comptabilite/services/contratsAssurance';
import type { Facture } from '@/features/comptabilite/types';
import { CATEGORIE_DEPENSE, OBJET_ASSURANCE, TYPE_FACTURE } from '@/shared/constants/comptabilite';

const prime = (extra: Partial<Facture>): Facture =>
  ({
    id: 'f',
    date: '2026-03-01',
    montant: 900,
    type: TYPE_FACTURE.RECUE,
    categorieDepense: CATEGORIE_DEPENSE.ASSURANCES,
    tiers: 'Groupama',
    ...extra,
  }) as Facture;

const voiture = { id: 'v1', plaque: 'AB-123-CD', actif: true };
const ancienne = { id: 'v2', plaque: 'ZZ-999-ZZ', actif: false };

describe('contrats proposés pour l’échéancier des assurances', () => {
  it('propose une assurance par assureur et par objet, avec la dernière prime et la prochaine échéance', () => {
    const propositions = propositionsDeContrats(
      [prime({ id: 'a', objetAssurance: OBJET_ASSURANCE.BATIMENTS, montant: 943.09, date: '2026-02-10' })],
      [],
      [],
      '2026-10-22',
    );
    expect(propositions).toHaveLength(1);
    expect(propositions[0]).toMatchObject({
      nom: 'Bâtiments — Groupama',
      prime: 943.09,
      periodicite: 'annuelle',
      prochaineEcheance: '2027-02-10',
    });
  });

  it('désigne un véhicule par sa plaque et ne propose que les véhicules actifs', () => {
    const propositions = propositionsDeContrats(
      [
        prime({ id: 'a', objetAssurance: OBJET_ASSURANCE.VEHICULE, vehiculeId: 'v1' }),
        prime({ id: 'b', objetAssurance: OBJET_ASSURANCE.VEHICULE, vehiculeId: 'v2' }),
      ],
      [voiture, ancienne],
      [],
      '2026-10-22',
    );
    expect(propositions.map((p) => p.nom)).toEqual(['Véhicule AB-123-CD — Groupama']);
  });

  it('propose un véhicule actif sans assurance notée, et pas un véhicule dont l’assurance est résiliée', () => {
    expect(propositionsDeContrats([], [voiture, ancienne], [], '2026-10-22').map((p) => p.nom)).toEqual(['Véhicule AB-123-CD']);
    const resilie = { ...voiture, assuranceResilieeLe: '2026-06-01' };
    expect(
      propositionsDeContrats([prime({ objetAssurance: OBJET_ASSURANCE.VEHICULE, vehiculeId: 'v1', date: '2026-03-01' })], [resilie], [], '2026-10-22'),
    ).toEqual([]);
  });

  it('devine la périodicité de l’écart entre les deux dernières primes', () => {
    expect(periodiciteDeLEcart(30)).toBe('mensuelle');
    expect(periodiciteDeLEcart(91)).toBe('trimestrielle');
    expect(periodiciteDeLEcart(182)).toBe('semestrielle');
    expect(periodiciteDeLEcart(365)).toBe('annuelle');
  });

  it('ne reproposera pas un contrat déjà dans l’échéancier', () => {
    const premier = propositionsDeContrats([prime({ objetAssurance: OBJET_ASSURANCE.ANIMAUX })], [], [], '2026-10-22');
    expect(propositionsDeContrats([prime({ objetAssurance: OBJET_ASSURANCE.ANIMAUX })], [], [{ source: premier[0].cle }], '2026-10-22')).toEqual([]);
  });
});
