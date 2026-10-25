import { describe, expect, it } from 'vitest';
import { menusDeLaFenetre, menusDuPoste } from '@/features/accueil/shell/structureMenus';
import { ROUTES } from '@/shared/constants/routes';

const routesDe = (menus: ReturnType<typeof menusDuPoste>): string[] =>
  menus.flatMap((m) => [...(m.route ? [m.route] : []), ...(m.items ?? []).flatMap((e) => ('route' in e ? [e.route] : []))]);

describe('menus de la fenêtre Windows : les quatre rubriques du téléphone', () => {
  const fenetre = menusDeLaFenetre();

  it('Chèvres, Atelier, Visites et Plus, dans cet ordre', () => {
    expect(fenetre.map((m) => m.label)).toEqual(['Chèvres', 'Atelier', 'Visites', 'Plus']);
  });

  it('aucune page des anciens thèmes n’est perdue', () => {
    const montrees = new Set(routesDe(fenetre));
    expect(routesDe(menusDuPoste()).filter((route) => !montrees.has(route))).toEqual([]);
  });

  it('chaque rubrique reprend ses tuiles : la visite, la naissance, la fabrication, les listes du Plus', () => {
    const routes = routesDe(fenetre);
    expect(routes).toContain(ROUTES.COMMERCIAL_VISITE);
    expect(routes).toContain(ROUTES.CHEPTEL_NAISSANCE_NOUVELLE);
    expect(routes).toContain(ROUTES.productionFabricationSimple('fromage'));
    expect(routes).toContain(ROUTES.CHEPTEL_BILAN);
  });

  it('le mouvement des chèvres ouvre sa rubrique', () => {
    expect(routesDe(fenetre)).toContain(ROUTES.rubrique('mouvement'));
  });

  it('le poste de comptabilité garde ses huit thèmes', () => {
    expect(menusDuPoste().map((m) => m.label)).toEqual(['Accueil', 'Cheptel', 'Stock', 'Production', 'Commercial', 'Comptabilité', 'Contacts', 'Données']);
  });
});
