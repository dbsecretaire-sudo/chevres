import { useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { pageAvantLaCreation, revenirA } from '@/shared/navigation/historiqueDesPages';

/**
 * Quand on ouvre une page depuis un bouton de l'accueil, d'un intérieur (l'exploitation, le travail du produit) ou de la grange, la flèche de
 * retour ramène à cet endroit précis, et pas à la dernière page vue par la barre du bas. On note d'où l'on part (`adresse`) et la page qu'on
 * ouvre (`destination`) : la flèche n'y renvoie que depuis cette première page ; une page ouverte depuis elle revient d'abord à elle.
 */
interface Origine {
  adresse: string;
  destination: string;
  /** L'origine qui valait avant celle-ci (la page d'un lieu, ouverte depuis l'accueil, qui ouvre à son tour une écriture) : on la retrouve au retour. */
  precedente?: Origine;
}

let origine: Origine | null = null;
const ecouteurs = new Set<() => void>();
const notifier = () => ecouteurs.forEach((ecouteur) => ecouteur());

/** On part de `adresse` pour ouvrir `destination` : la flèche de retour de cette page y ramènera. */
export function noterOrigine(adresse: string, destination: string): void {
  origine = { adresse, destination, precedente: origine ?? undefined };
  notifier();
}

/** On est revenu à l'endroit d'où l'on était parti : l'origine d'avant (celle qui ramenait à l'accueil, par exemple) vaut de nouveau. */
function revenirDe(point: Origine): void {
  origine = point.precedente ?? null;
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
 * habituel (`retourParDefaut`, ou la page d'où a commencé la création d'après l'historique du téléphone, ou l'écran d'avant, ou l'accueil). Terminer un formulaire (enregistrer,
 * annuler) ramène donc à la page d'où on l'a ouvert, même quand il n'a pas noté son origine.
 */
export function useRetour(retourParDefaut?: () => void): () => void {
  const router = useRouter();
  const chemin = usePathname();
  const point = useOrigineRetour();
  return () => {
    if (point && chemin === point.destination.split('?')[0]) {
      revenirDe(point);
      router.navigate(point.adresse as never);
    } else if (retourParDefaut) retourParDefaut();
    else {
      // Terminer un formulaire : la page d'où a commencé la création (la page d'Assurance pour une facture d'assurance, même après la création d'un intervenant entre-temps).
      const avant = pageAvantLaCreation();
      if (avant) {
        revenirA(avant);
        router.navigate(avant as never);
      } else if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  };
}
