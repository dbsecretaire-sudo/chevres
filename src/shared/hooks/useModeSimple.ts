import { useSyncExternalStore } from 'react';

/**
 * Vrai pendant que le mode normal (le mode simple) est choisi. Posé par le choix du mode (features/roles) ; les composants partagés (le bouton « + »…) le lisent
 * ici, sans connaître les rôles.
 */
let simple = false;
const abonnes = new Set<() => void>();

export function definirModeSimple(valeur: boolean): void {
  if (simple === valeur) return;
  simple = valeur;
  abonnes.forEach((rappel) => rappel());
}

export const useModeSimple = (): boolean =>
  useSyncExternalStore(
    (rappel) => {
      abonnes.add(rappel);
      return () => abonnes.delete(rappel);
    },
    () => simple,
    () => false,
  );
