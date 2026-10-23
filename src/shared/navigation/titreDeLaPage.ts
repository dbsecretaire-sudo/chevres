import { useSyncExternalStore } from 'react';

/** Le titre de la page ouverte, publié par son en-tête : le fil d'Ariane du bas (qui n'est pas dans l'écran) le lit pour sa dernière étape. */
interface TitrePublie {
  titre: string;
  /** La page à laquelle il appartient : un titre resté d'une page précédente n'est pas montré. */
  adresse: string;
}

let publie: TitrePublie = { titre: '', adresse: '' };
const ecouteurs = new Set<() => void>();

export function publierTitre(titre: string, adresse: string): void {
  if (publie.titre === titre && publie.adresse === adresse) return;
  publie = { titre, adresse };
  ecouteurs.forEach((ecouteur) => ecouteur());
}

/** Le titre de la page à cette adresse ; vide tant que son en-tête ne l'a pas publié. */
export function useTitreDeLaPage(adresse: string): string {
  const courant = useSyncExternalStore(
    (ecouteur) => {
      ecouteurs.add(ecouteur);
      return () => ecouteurs.delete(ecouteur);
    },
    () => publie,
  );
  return courant.adresse === adresse ? courant.titre : '';
}
