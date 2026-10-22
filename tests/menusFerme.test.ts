import { describe, expect, it } from 'vitest';
import { actionsDuLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { BOUTONS_DE_LA_FERME, ROUTE_DIRECTE } from '@/features/accueil/ferme/routesFerme';

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
