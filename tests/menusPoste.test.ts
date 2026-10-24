import { describe, expect, it } from 'vitest';
import { menusDeLaFerme, menusDuPoste } from '@/features/accueil/shell/structureMenus';

const routesDe = (menus: ReturnType<typeof menusDuPoste>): string[] =>
  menus.flatMap((m) => [...(m.route ? [m.route] : []), ...(m.items ?? []).flatMap((e) => ('route' in e ? [e.route] : []))]);

describe('menus du poste de comptabilité : huit thèmes', () => {
  const poste = menusDuPoste();

  it('les huit thèmes, dans l’ordre demandé', () => {
    expect(poste.map((m) => m.label)).toEqual(['Accueil', 'Cheptel', 'Stock', 'Production', 'Commercial', 'Comptabilité', 'Contacts', 'Données']);
  });

  /** Les pages que le poste de comptabilité ne montre volontairement plus : le stock de la grange, et la page des réglages des contacts (le menu Contacts a la liste et ses catégories). */
  const RETIREES_VOLONTAIREMENT = ['/production/lieu?lieu=grange', '/organisation-tiers', '/comptabilite/nouvelle?type=recue', '/cheptel/menu'];

  it('aucune page des menus de la ferme n’est perdue, hors celles qu’on a retirées exprès', () => {
    const rangees = new Set(routesDe(poste));
    const perdues = routesDe(menusDeLaFerme()).filter((route) => !rangees.has(route) && !RETIREES_VOLONTAIREMENT.includes(route));
    expect(perdues).toEqual([]);
  });

  it('les statistiques de l’alimentation sont dans le Cheptel, sous leur nouveau nom', () => {
    const cheptel = poste.find((m) => m.label === 'Cheptel');
    const entree = (cheptel?.items ?? []).find((e) => 'route' in e && e.route === '/sante/alimentation');
    expect(entree && 'label' in entree ? entree.label : '').toBe('Alimentation · Statistiques');
  });

  it('une page n’est rangée qu’une fois', () => {
    const routes = routesDe(poste);
    expect(routes.filter((r, i) => routes.indexOf(r) !== i)).toEqual([]);
  });

  it('l’agritourisme n’est plus un thème : ses pages sont dans le Commercial', () => {
    const commercial = poste.find((m) => m.label === 'Commercial');
    const routes = routesDe([commercial as (typeof poste)[number]]);
    expect(routes).toContain('/commercial/formules');
    expect(routes).toContain('/commercial/visite');
  });

  it('tous les intervenants sont dans Contacts, sous un seul titre', () => {
    const contacts = poste.find((m) => m.label === 'Contacts');
    const titres = (contacts?.items ?? []).flatMap((e) => ('separateur' in e && e.titre ? [e.titre] : []));
    expect(titres).toEqual(['Intervenants']);
    const routes = routesDe([contacts as (typeof poste)[number]]);
    expect(routes).toContain('/production/lieu?lieu=abattoir');
    expect(routes).toContain('/production/lieu?lieu=banque');
    expect(routes).toContain('/production/lieu?lieu=assurance');
  });

  it('les intervenants sont classés par ordre alphabétique', () => {
    const contacts = poste.find((m) => m.label === 'Contacts');
    const items = contacts?.items ?? [];
    const debut = items.findIndex((e) => 'separateur' in e && e.titre === 'Intervenants');
    const libelles = items.slice(debut + 1).flatMap((e) => ('label' in e ? [e.label] : []));
    expect(libelles.length).toBeGreaterThan(10);
    expect(libelles).toEqual([...libelles].sort((a, b) => a.localeCompare(b, 'fr')));
  });

  it('la comptabilité montre ses six pages directement, sans sous-menu, et « Nouvelle facture » est dans les écritures', () => {
    const items = poste.find((m) => m.label === 'Comptabilité')?.items ?? [];
    const directes = items.slice(0, items.findIndex((e) => 'separateur' in e)).flatMap((e) => ('label' in e ? [e.label] : []));
    expect(directes).toEqual(['Écritures', 'Inventaire', 'Trésorerie', 'Rentabilité', 'Pilotage de la TVA', 'Fiscalité']);
    expect(routesDe(poste)).not.toContain('/comptabilite/nouvelle?type=recue');
  });

  it('un thème qui n’a qu’une partie ne la titre pas (Stock n’a pas de partie « Stocks »)', () => {
    const stock = poste.find((m) => m.label === 'Stock');
    expect((stock?.items ?? []).some((e) => 'separateur' in e)).toBe(false);
  });
});
