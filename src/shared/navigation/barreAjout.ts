import { useSyncExternalStore } from 'react';

/**
 * Pendant un ajout, la barre d'onglets est bleue (voir useAjoutTabBarBleu). Les onglets qui gardent leur couleur d'origine à
 * certains endroits (le cheptel quand on est dans la santé…) doivent alors suivre la barre : ce drapeau dit si elle est bleue.
 */
let bleue = false;
const ecouteurs = new Set<() => void>();

export function definirBarreAjoutBleue(valeur: boolean): void {
  if (bleue === valeur) return;
  bleue = valeur;
  ecouteurs.forEach((ecouteur) => ecouteur());
}

export const useBarreAjoutBleue = (): boolean =>
  useSyncExternalStore(
    (ecouteur) => {
      ecouteurs.add(ecouteur);
      return () => ecouteurs.delete(ecouteur);
    },
    () => bleue,
    () => false,
  );
