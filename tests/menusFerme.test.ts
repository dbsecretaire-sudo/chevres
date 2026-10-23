import { describe, expect, it } from 'vitest';
import { actionsDuLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { BOUTONS_DE_LA_FERME, ENTREES_RETIREES_DES_MENUS, ROUTE_DIRECTE } from '@/features/accueil/ferme/routesFerme';
import { LIEUX_TIERS } from '@/features/accueil/services/lieuxTiers';
import { ROUTES } from '@/shared/constants/routes';

describe('plan des boutons de l’accueil, repris par les menus du haut', () => {
  it('chaque bouton de l’accueil mène quelque part : une page, ou des bulles', () => {
    for (const cote of Object.values(BOUTONS_DE_LA_FERME)) {
      for (const [cle] of [...cote.gestion, ...cote.intervenants]) {
        const mene = !!ROUTE_DIRECTE[cle] || actionsDuLieu(cle as CibleDesBulles).length > 0;
        expect(mene, `le bouton « ${cle} » n’ouvre rien`).toBe(true);
      }
    }
  });

  it('les trois côtés : exploitation, atelier (transformation) et agritourisme, avec le cadre réglementaire parmi les intervenants', () => {
    expect(Object.keys(BOUTONS_DE_LA_FERME)).toEqual(['exploitation', 'transformation', 'agritourisme']);
    expect(BOUTONS_DE_LA_FERME.agritourisme.intervenants.map(([cle]) => cle)).toContain('cadreReglementaire');
    expect(ROUTE_DIRECTE.cadreReglementaire).toBe('/commercial/accueil-public');
  });

  it('un bouton n’est pas listé deux fois dans un même côté', () => {
    for (const cote of Object.values(BOUTONS_DE_LA_FERME)) {
      const cles = [...cote.gestion, ...cote.intervenants].map(([cle]) => cle);
      expect(new Set(cles).size).toBe(cles.length);
    }
  });
});

describe('entrées retirées des menus : chacune reste accessible ailleurs', () => {
  const liensDe = (lieu: keyof typeof LIEUX_TIERS) => LIEUX_TIERS[lieu].liens.map((l) => l.route.split('?')[0]);

  it('les analyses : la page Analyses les propose toutes', () => {
    const liens = liensDe('analyses');
    for (const route of ENTREES_RETIREES_DES_MENUS.filter((r) => r.includes('analyses') || r.includes('controles'))) {
      expect(liens, route).toContain(route.split('?')[0]);
    }
  });

  it('le chiffre d’affaires, les commandes et les circuits : les fiches des clients les proposent', () => {
    const liens = liensDe('particuliers');
    for (const route of [ROUTES.COMMERCIAL_VENTES, ROUTES.COMMERCIAL_COMMANDES, ROUTES.COMMERCIAL_CIRCUITS]) {
      expect(ENTREES_RETIREES_DES_MENUS).toContain(route);
      expect(liens, route).toContain(route);
    }
  });
});
