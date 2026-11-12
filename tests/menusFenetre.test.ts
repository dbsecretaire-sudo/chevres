import { describe, expect, it } from 'vitest';
import { menusDeLaFenetre, menusDuPoste } from '@/features/accueil/shell/structureMenus';
import { ROUTES } from '@/shared/constants/routes';
import { RUBRIQUES } from '@/features/accueil/rubriques/rubriquesDuPlus';

const routesDe = (menus: ReturnType<typeof menusDuPoste>): string[] =>
  menus.flatMap((m) => [...(m.route ? [m.route] : []), ...(m.items ?? []).flatMap((e) => ('route' in e ? [e.route] : []))]);

describe('menus de la fenêtre Windows : les quatre rubriques du téléphone', () => {
  const fenetre = menusDeLaFenetre();

  it('Ferme, Contacts, Comptabilité et Plus, dans cet ordre', () => {
    expect(fenetre.map((m) => m.label)).toEqual(['Ferme', 'Contacts', 'Comptabilité', 'Plus']);
  });

  it('les documents sont dans la Ferme, rangés par usage', () => {
    const libelles = (fenetre.find((m) => m.label === 'Ferme')?.items ?? []).flatMap((e) => ('label' in e ? [e.label] : []));
    expect(libelles).toEqual(expect.arrayContaining(['Registre des analyses', 'Étiquettes', 'Export pour le comptable']));
  });

  it('les partenaires sont dans les Contacts, plus dans le Plus', () => {
    const lignes = RUBRIQUES.partenaires.sections.flatMap((s) => s.lignes.map((l) => l.route));
    const routesDu = (nom: string) => routesDe(fenetre.filter((m) => m.label === nom));
    expect(lignes.every((route) => routesDu('Contacts').includes(route))).toBe(true);
    expect(lignes.some((route) => routesDu('Plus').includes(route))).toBe(false);
  });

  it('aucune page des anciens thèmes n’est perdue', () => {
    const montrees = new Set(routesDe(fenetre));
    expect(routesDe(menusDuPoste()).filter((route) => !montrees.has(route))).toEqual([]);
  });

  it('chaque rubrique reprend ses tuiles : la visite, la naissance, la fabrication, les listes du Plus', () => {
    const routes = routesDe(fenetre);
    expect(routes).toContain(ROUTES.COMMERCIAL_VISITE);
    expect(routes).toContain(ROUTES.CHEPTEL_NAISSANCES);
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
