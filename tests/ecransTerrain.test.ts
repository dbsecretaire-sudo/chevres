import { describe, expect, it } from 'vitest';
import { titreDuTerrain, tuilesDuTerrain, ZONES_TERRAIN, type ComptesTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { ROUTES } from '@/shared/constants/routes';

const comptes = (surcharge: Partial<ComptesTerrain> = {}): ComptesTerrain => ({
  animaux: 236,
  naissances: 18,
  delais: 0,
  ventesSansDocument: 0,
  aCompleter: 0,
  lotsAFacturer: 0,
  viandeAFacturer: 0,
  lotsARappeler: 0,
  stockNegatif: false,
  visitesAVenir: 0,
  ...surcharge,
});

describe('écrans terrain des trois zones de l’accueil', () => {
  it('chaque zone a son titre et au moins un bouton, et le bouton Contacts est sur les trois', () => {
    for (const zone of ZONES_TERRAIN) {
      expect(titreDuTerrain(zone)).not.toBe('');
      const tuiles = tuilesDuTerrain(zone, comptes());
      expect(tuiles.length).toBeGreaterThan(0);
      expect(tuiles.find((t) => t.cle === 'contacts')?.route).toBe(ROUTES.CONTACTS);
    }
  });

  it('les boutons sont tous distincts et ont une adresse', () => {
    for (const zone of ZONES_TERRAIN) {
      const tuiles = tuilesDuTerrain(zone, comptes());
      expect(new Set(tuiles.map((t) => t.cle)).size).toBe(tuiles.length);
      expect(tuiles.every((t) => t.route.startsWith('/'))).toBe(true);
    }
  });

  it('le troupeau montre le nombre d’animaux, et les alertes (délais, document qui manque) en rouge ; zéro ne s’affiche pas', () => {
    const propre = tuilesDuTerrain('troupeau', comptes());
    expect(propre.find((t) => t.cle === 'liste')).toMatchObject({ nombre: 236, alerte: false });
    expect(propre.find((t) => t.cle === 'traitement')?.nombre).toBeUndefined();
    expect(propre.find((t) => t.cle === 'venteVivant')?.nombre).toBeUndefined();
    const alertes = tuilesDuTerrain('troupeau', comptes({ delais: 3, ventesSansDocument: 2 }));
    expect(alertes.find((t) => t.cle === 'traitement')).toMatchObject({ nombre: 3, alerte: true });
    expect(alertes.find((t) => t.cle === 'venteVivant')).toMatchObject({ nombre: 2, alerte: true });
  });

  it('le troupeau propose « À compléter » (ce que le berger a saisi), avec son nombre en rouge quand il y en a', () => {
    const sans = tuilesDuTerrain('troupeau', comptes()).find((t) => t.cle === 'aCompleter');
    expect(sans).toMatchObject({ route: ROUTES.CHEPTEL_A_COMPLETER });
    expect(sans?.nombre).toBeUndefined();
    expect(tuilesDuTerrain('troupeau', comptes({ aCompleter: 3 })).find((t) => t.cle === 'aCompleter')).toMatchObject({ nombre: 3, alerte: true });
  });

  it('l’atelier compte la viande à facturer (pas le cheptel) et signale un stock négatif', () => {
    const tuiles = tuilesDuTerrain('atelier', comptes({ viandeAFacturer: 4, stockNegatif: true, lotsARappeler: 1 }));
    expect(tuiles.find((t) => t.cle === 'viande')).toMatchObject({ nombre: 4, alerte: true });
    expect(tuiles.find((t) => t.cle === 'stock')?.alerte).toBe(true);
    expect(tuiles.find((t) => t.cle === 'lotsAtelier')).toMatchObject({ nombre: 1, alerte: true });
    // Les quatre fabrications ouvrent la page de fabrication de leur produit.
    expect(tuiles.filter((t) => t.route.startsWith('/production/fabrication')).length).toBe(4);
  });

  it('l’accueil du public propose la nouvelle visite d’abord, et le nombre de visites à venir', () => {
    const tuiles = tuilesDuTerrain('accueil', comptes({ visitesAVenir: 5 }));
    expect(tuiles[0]).toMatchObject({ cle: 'nouvelleVisite', route: ROUTES.COMMERCIAL_VISITE });
    expect(tuiles.find((t) => t.cle === 'visites')?.nombre).toBe(5);
  });

  it('l’adresse d’une zone ouvre l’écran terrain de cette zone', () => {
    expect(ROUTES.terrain('atelier')).toBe('/production/terrain?zone=atelier');
  });
});
