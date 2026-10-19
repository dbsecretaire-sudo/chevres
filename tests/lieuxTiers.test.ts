import { describe, expect, it } from 'vitest';
import { ecrituresDuLieu, estLieuTiers, LIEUX_TIERS } from '@/features/accueil/services/lieuxTiers';
import { ecrituresParTiers } from '@/features/comptabilite/services/filtresTransactions';

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
      if (c.avecTiers) expect(c.nouvelle).toMatch(/^\/comptabilite\/nouvelle\?type=(recue|emise)/);
      c.liens.forEach((l) => expect(l.route.startsWith('/')).toBe(true));
    }
  });
});

describe('écritures rangées par tiers', () => {
  it('range par nom de tiers sans tenir compte de la casse ni des accents, puis du plus récent au plus ancien', () => {
    const rangees = ecrituresParTiers([
      { titre: 'Zèbre SARL', date: '2026-01-01' },
      { titre: 'agri sud', date: '2026-02-01' },
      { titre: 'Agri Sud', date: '2026-05-01' },
      { titre: 'École', date: '2026-03-01' },
    ]);
    expect(rangees.map((e) => `${e.titre}@${e.date}`)).toEqual([
      'Agri Sud@2026-05-01',
      'agri sud@2026-02-01',
      'École@2026-03-01',
      'Zèbre SARL@2026-01-01',
    ]);
  });

  it('ne modifie pas la liste d’origine', () => {
    const liste = [
      { titre: 'B', date: '2026-01-01' },
      { titre: 'A', date: '2026-01-01' },
    ];
    ecrituresParTiers(liste);
    expect(liste[0].titre).toBe('B');
  });
});

describe('rangement des rubriques', () => {
  it('l’entrepôt n’a que des rubriques de stock, sans tiers', () => {
    expect(LIEUX_TIERS.entrepot.avecTiers).toBe(false);
    expect(LIEUX_TIERS.entrepot.liens.length).toBeGreaterThan(5);
  });
  it('les organismes rassemblent le dossier PAC, les terrains et le bilan annuel', () => {
    const cles = LIEUX_TIERS.organismes.liens.map((l) => l.cle);
    expect(cles).toEqual(expect.arrayContaining(['dossierPac', 'terrains', 'bilan']));
  });
  it('le commerce a ses rubriques de vente et des clients pour tiers', () => {
    expect(LIEUX_TIERS.commercial.liens.map((l) => l.cle)).toEqual(expect.arrayContaining(['ventes', 'commandes', 'tarifs']));
    expect(LIEUX_TIERS.commercial.categoriesContact.length).toBeGreaterThan(0);
  });
});
