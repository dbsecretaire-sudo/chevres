import { describe, expect, it } from 'vitest';
import type { MenuBureau } from '@/bureau/pont';
import { cheminDansLesMenus, filDeLaPage } from '@/shared/navigation/filAriane';

const MENUS: MenuBureau[] = [
  {
    label: 'Atelier',
    items: [
      { label: 'Atelier', route: '/atelier' },
      { separateur: true, titre: 'Gestion' },
      { label: 'Stock', route: '/atelier/stock' },
      { label: 'Réserver', route: '/commercial/commandes' },
      { separateur: true, titre: 'Intervenants' },
      { label: 'Banque', route: '/banque' },
    ],
  },
  { label: 'Contacts', route: '/comptabilite/contacts' },
];

describe('fil d’Ariane', () => {
  it('une page de menu : le menu, la partie, la page — chaque étape va quelque part', () => {
    expect(cheminDansLesMenus(MENUS, '/commercial/commandes')).toEqual([
      { libelle: 'Atelier', route: '/atelier' },
      { libelle: 'Gestion', route: '/atelier/stock' },
      { libelle: 'Réserver', route: '/commercial/commandes' },
    ]);
  });

  it('l’accueil d’un menu qui porte son nom n’apparaît qu’une fois', () => {
    expect(cheminDansLesMenus(MENUS, '/atelier')).toEqual([{ libelle: 'Atelier', route: '/atelier' }]);
  });

  it('un écran de formulaire se place sous la dernière page de menu vue', () => {
    const fil = filDeLaPage(MENUS, undefined, '/commercial/commandes', 'Nouvelle commande');
    expect(fil.map((m) => m.libelle)).toEqual(['Atelier', 'Gestion', 'Réserver', 'Nouvelle commande']);
    expect(fil[2].route).toBe('/commercial/commandes');
    expect(fil[3].route).toBeUndefined();
  });

  it('la page ouverte est la dernière étape, sans lien ; son titre n’est pas répété', () => {
    const fil = filDeLaPage(MENUS, '/atelier/stock', '/atelier/stock', 'Stock');
    expect(fil.map((m) => m.libelle)).toEqual(['Atelier', 'Gestion', 'Stock']);
    expect(fil[2].route).toBeUndefined();
  });

  it('un titre qui ne diffère du nom de la page que par le pluriel n’est pas répété', () => {
    expect(filDeLaPage(MENUS, '/atelier/stock', '/atelier/stock', 'Stocks').map((m) => m.libelle)).toEqual(['Atelier', 'Gestion', 'Stock']);
  });

  it('une page qu’aucun menu ne porte, sans page vue avant : seulement son titre', () => {
    expect(filDeLaPage(MENUS, undefined, undefined, 'Réglages')).toEqual([{ libelle: 'Réglages' }]);
  });
});
