import { useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'expo-router';

/**
 * Quand on ouvre une page depuis un bouton de l'accueil, d'un intérieur (l'exploitation, le travail du produit) ou de la grange, la flèche de
 * retour ramène à cet endroit précis, et pas à la dernière page vue par la barre du bas. On note d'où l'on part (`adresse`) et la page qu'on
 * ouvre (`destination`) : la flèche n'y renvoie que depuis cette première page ; une page ouverte depuis elle revient d'abord à elle.
 */
interface Origine {
  adresse: string;
  destination: string;
}

let origine: Origine | null = null;
const ecouteurs = new Set<() => void>();
const notifier = () => ecouteurs.forEach((ecouteur) => ecouteur());

/** On part de `adresse` pour ouvrir `destination` : la flèche de retour de cette page y ramènera. */
export function noterOrigine(adresse: string, destination: string): void {
  origine = { adresse, destination };
  notifier();
}

/** On est revenu, ou on a changé d'endroit (la maison, un onglet) : l'origine s'efface. */
export function effacerOrigine(): void {
  if (origine === null) return;
  origine = null;
  notifier();
}

/** Le point de départ de la page ouverte, s'il y en a un. */
export const useOrigineRetour = (): Origine | null =>
  useSyncExternalStore(
    (ecouteur) => {
      ecouteurs.add(ecouteur);
      return () => ecouteurs.delete(ecouteur);
    },
    () => origine,
    () => null,
  );

/**
 * Ce que fait la flèche de retour d'une page : revenir à l'endroit d'où l'on a cliqué quand cette page vient d'un bouton, sinon le retour
 * habituel (`retourParDefaut`, ou l'écran d'avant, ou l'accueil).
 */
export function useRetour(retourParDefaut?: () => void): () => void {
  const router = useRouter();
  const chemin = usePathname();
  const point = useOrigineRetour();
  return () => {
    if (point && chemin === point.destination.split('?')[0]) {
      effacerOrigine();
      router.navigate(point.adresse as never);
    } else if (retourParDefaut) retourParDefaut();
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };
}
