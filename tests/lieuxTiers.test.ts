import { describe, expect, it } from 'vitest';
import { ecrituresDuLieu, estLieuTiers, LIEUX_TIERS } from '@/features/accueil/services/lieuxTiers';

const ecritures = [
  { titre: 'Station Total', categorie: 'carburant' },
  { titre: 'Agri Sud', categorie: 'alimentation' },
  { titre: 'Mme Dupont', categorie: undefined, libelleCategorie: 'Boucherie / charcuterie' },
  { titre: 'ATM', categorie: 'autre' },
  { titre: 'Autre fournisseur', categorie: 'autre' },
];

describe('lieux avec tiers', () => {
  it('reconnaît les lieux', () => {
    expect(estLieuTiers('carburant')).toBe(true);
    expect(estLieuTiers('laiterie')).toBe(false);
    expect(estLieuTiers(undefined)).toBe(false);
  });

  it('garde les factures de la catégorie du lieu', () => {
    const garde = ecrituresDuLieu(LIEUX_TIERS.carburant, ecritures, [], (c) => c);
    expect(garde.map((e) => e.titre)).toEqual(['Station Total']);
  });

  it('garde aussi les écritures de ses tiers, sans tenir compte de la casse, même d’une autre catégorie', () => {
    const garde = ecrituresDuLieu(LIEUX_TIERS.equarrissage, ecritures, ['atm'], (c) => c);
    expect(garde.map((e) => e.titre)).toEqual(['ATM']);
  });

  it('garde les ventes d’une catégorie par leur libellé', () => {
    const garde = ecrituresDuLieu(LIEUX_TIERS.boucherie, ecritures, [], () => 'Boucherie / charcuterie');
    expect(garde.map((e) => e.titre)).toEqual(['Mme Dupont']);
  });

  it('chaque lieu ouvre « Nouvelle facture » dans une catégorie, et ses rubriques ont une route', () => {
    for (const c of Object.values(LIEUX_TIERS)) {
      expect(c.nouvelle).toMatch(/^\/comptabilite\/nouvelle\?type=(recue|emise)/);
      c.liens.forEach((l) => expect(l.route.startsWith('/')).toBe(true));
    }
  });
});
