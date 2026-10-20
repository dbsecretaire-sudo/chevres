import { useSyncExternalStore } from 'react';

/** Une rubrique du menu « Menus » : le Cheptel, la Production, le Commercial, la Comptabilité, l'Organisation. */
export interface EntreeMenu {
  cle: string;
  libelle: string;
  /** La rubrique où l'on est : elle se met en évidence dans la liste. */
  actif: boolean;
  onPress: () => void;
}

/**
 * Les rubriques du menu « Menus » de la capsule du haut. Les onglets de l'application les connaissent (lesquelles existent pour cet
 * établissement, comment s'y rendre) : la barre du bas (`BarreDuBas`) les publie ici, et la capsule, présente sur toutes les pages, les lit.
 */
let entrees: readonly EntreeMenu[] = [];
const abonnes = new Set<() => void>();

export function publierMenus(nouvelles: readonly EntreeMenu[]): void {
  entrees = nouvelles;
  abonnes.forEach((f) => f());
}

const sAbonner = (f: () => void) => {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
};

export const useMenusSections = (): readonly EntreeMenu[] => useSyncExternalStore(sAbonner, () => entrees);
