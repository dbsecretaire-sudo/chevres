import { useSyncExternalStore } from 'react';

/**
 * Certains écrans s'ouvrent depuis plusieurs endroits (les clients, les fournisseurs et les comptes du plan comptable depuis
 * l'Organisation ; l'alimentation, les visites et les contrôles depuis le Cheptel). Tant qu'on y est entré de l'un d'eux, la flèche
 * de retour ramène à la page d'où l'on vient, et c'est son onglet qui reste en couleur dans la barre du bas. Le contexte dit
 * l'adresse de cette page (aucun : on vient d'ailleurs).
 */
let retour: string | null = null;
const ecouteurs = new Set<() => void>();
const notifier = () => ecouteurs.forEach((ecouteur) => ecouteur());

/** On entre dans un écran depuis une page (son adresse) : la flèche de retour y ramènera. */
export function entrerAvecRetour(adresse: string): void {
  retour = adresse;
  notifier();
}

/** On est revenu à la page d'origine, ou on a changé d'onglet : le contexte s'efface. */
export function quitterRetour(): void {
  if (retour === null) return;
  retour = null;
  notifier();
}

/** La page d'où l'on est venu, ou rien. */
export const useRetourContexte = (): string | null =>
  useSyncExternalStore(
    (ecouteur) => {
      ecouteurs.add(ecouteur);
      return () => ecouteurs.delete(ecouteur);
    },
    () => retour,
    () => null,
  );
