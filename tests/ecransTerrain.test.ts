import { describe, expect, it } from 'vitest';
import { titreDuTerrain, tuilesDuTerrain, ZONES_TERRAIN, type ComptesTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { ROUTES } from '@/shared/constants/routes';

const comptes = (surcharge: Partial<ComptesTerrain> = {}): ComptesTerrain => ({
  animaux: 236,
  naissances: 18,
  delais: 0,
  ventesSansDocument: 0,
  lotsAFacturer: 0,
  viandeAFacturer: 0,
  viandeAVendre: 0,
  lotsARappeler: 0,
  stockNegatif: false,
  visitesAVenir: 0,
  ...surcharge,
});

describe('écrans terrain des zones de l’accueil', () => {
  it('chaque zone a son titre et au moins un bouton ; les contacts sont dans les rubriques du menu, plus sur les écrans terrain', () => {
    for (const zone of ZONES_TERRAIN) {
      expect(titreDuTerrain(zone)).not.toBe('');
      const tuiles = tuilesDuTerrain(zone, comptes());
      expect(tuiles.length).toBeGreaterThan(0);
      expect(tuiles.find((t) => t.cle === 'contacts')).toBeUndefined();
    }
  });

  it('les boutons sont tous distincts et ont une adresse', () => {
    for (const zone of ZONES_TERRAIN) {
      const tuiles = tuilesDuTerrain(zone, comptes());
      expect(new Set(tuiles.map((t) => t.cle)).size).toBe(tuiles.length);
      expect(tuiles.every((t) => t.route.startsWith('/'))).toBe(true);
    }
  });

  it('le troupeau montre les six tuiles de la maquette, dans l’ordre ; le cheptel donne le nombre d’animaux, et le délai d’attente se signale en rouge', () => {
    const propre = tuilesDuTerrain('troupeau', comptes());
    // Les six tuiles du troupeau, puis les lignes « Gestion » (réglages du cheptel, bilan), puis celles de l'Historique, sans chiffre.
    expect(propre.slice(0, 6).map((t) => t.cle)).toEqual(['scanner', 'naissance', 'traitement', 'mouvement', 'deces', 'cheptel']);
    expect(propre.slice(0, 6).some((t) => t.ligne)).toBe(false);
    expect(propre.slice(6, 8).map((t) => t.titre)).toEqual(['Réglages du cheptel', 'Bilan annuel']);
    expect(propre.slice(6).every((t) => t.ligne)).toBe(true);
    expect(propre[6]).toMatchObject({ route: ROUTES.CHEPTEL_REGLAGES });
    expect(propre[7]).toMatchObject({ route: ROUTES.CHEPTEL_BILAN });
    expect(propre.find((t) => t.cle === 'cheptel')).toMatchObject({ nombre: 236, alerte: false });
    expect(propre.find((t) => t.cle === 'traitement')?.nombre).toBeUndefined();
    const alertes = tuilesDuTerrain('troupeau', comptes({ delais: 3 }));
    expect(alertes.find((t) => t.cle === 'traitement')).toMatchObject({ nombre: 3, alerte: true });
  });

  it('le mouvement des chèvres s’ouvre dans sa rubrique, et signale les ventes vivantes sans document en rouge', () => {
    expect(tuilesDuTerrain('troupeau', comptes()).find((t) => t.cle === 'mouvement')?.route).toBe(ROUTES.rubrique('mouvement'));
    expect(tuilesDuTerrain('troupeau', comptes({ ventesSansDocument: 2 })).find((t) => t.cle === 'mouvement')).toMatchObject({ nombre: 2, alerte: true });
  });

  it('l’historique s’affiche dans son groupe, sans ligne « Historique » qui fasse doublon et sans « à compléter »', () => {
    const tuiles = tuilesDuTerrain('troupeau', comptes());
    expect(tuiles.some((t) => t.titre === 'Historique')).toBe(false);
    const historique = tuiles.filter((t) => t.groupe === 'Historique');
    expect(historique.map((t) => t.titre)).toEqual(expect.arrayContaining(['Naissances', 'Sorties et morts', 'Stock']));
    expect(historique.some((t) => t.titre === 'À compléter')).toBe(false);
    expect(historique.every((t) => t.ligne)).toBe(true);
    expect(historique.find((t) => t.titre === 'Naissances')).toMatchObject({ route: ROUTES.CHEPTEL_NAISSANCES });
  });

  it('l’atelier suit la maquette : six tuiles (fabriquer, scanner un lot, vendre, lait, stock, recettes), et des menus dessous ; un stock négatif se signale', () => {
    const tuiles = tuilesDuTerrain('atelier', comptes({ viandeAFacturer: 4, stockNegatif: true, lotsARappeler: 1 }));
    const tuilesPrincipales = tuiles.filter((t) => !t.ligne).map((t) => t.cle);
    expect(tuilesPrincipales.sort()).toEqual(['fabriquer', 'lait', 'recettes', 'scanLot', 'stock', 'ventes']);
    // Toutes les ventes sont réunies dans une tuile « Vendre », sans chiffre.
    expect(tuiles.find((t) => t.cle === 'ventes')).toMatchObject({ titre: 'Vendre' });
    expect(tuiles.find((t) => t.cle === 'ventes')?.nombre).toBeUndefined();
    expect(tuiles.find((t) => t.cle === 'stock')?.alerte).toBe(true);
    // Les menus : les lots (avec les étiquettes et la viande), la réglementation, les partenaires, les bilans et l'argent.
    expect(tuiles.filter((t) => t.ligne && t.groupe === 'Lots').map((t) => t.cle)).toEqual(['etiquettes', 'lotsDeLAtelier', 'viandeAtelier', 'historiqueRappels']);
    // L'argent, les bilans et les partenaires ne sont plus dans l'atelier : ils sont dans la Comptabilité et les Contacts.
    expect(tuiles.filter((t) => t.ligne && ['Argent', 'Bilans', 'Partenaires'].includes(t.groupe ?? '')).length).toBe(0);
    // Le contact n'est pas sur l'atelier.
    expect(tuiles.some((t) => t.cle === 'contacts')).toBe(false);
    // « Fabriquer » ouvre sa propre page, et c'est là que les quatre fabrications ouvrent la page de leur produit.
    expect(tuiles.find((t) => t.cle === 'fabriquer')?.route).toBe(ROUTES.terrain('fabriquer'));
    const fabriquer = tuilesDuTerrain('fabriquer', comptes());
    expect(fabriquer.map((t) => t.cle)).toEqual(['fromage', 'charcuterie', 'plat', 'savon']);
    expect(fabriquer.every((t) => t.route.startsWith('/production/fabrication'))).toBe(true);
  });

  it('l’accueil du public propose la nouvelle visite d’abord, et le nombre de visites à venir', () => {
    const tuiles = tuilesDuTerrain('accueil', comptes({ visitesAVenir: 5 }));
    expect(tuiles[0]).toMatchObject({ cle: 'nouvelleVisite', route: ROUTES.COMMERCIAL_VISITE_SIMPLE });
    expect(tuiles.find((t) => t.cle === 'visites')?.nombre).toBe(5);
  });

  it('l’adresse d’une zone ouvre l’écran terrain de cette zone', () => {
    expect(ROUTES.terrain('atelier')).toBe('/production/terrain?zone=atelier');
  });
});
