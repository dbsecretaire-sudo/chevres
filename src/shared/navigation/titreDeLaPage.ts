import { useSyncExternalStore } from 'react';

/** Le titre de la page ouverte, publié par son en-tête : le fil d'Ariane du bas (qui n'est pas dans l'écran) le lit pour sa dernière étape. */
interface TitrePublie {
  titre: string;
  /** La page à laquelle il appartient : un titre resté d'une page précédente n'est pas montré. */
  adresse: string;
}

let publie: TitrePublie = { titre: '', adresse: '' };
/** Le nom que la page donne elle-même à sa dernière étape (la fiche d'un contact : le nom du contact, à la place de « Contact »). */
let libelle: TitrePublie = { titre: '', adresse: '' };
const ecouteurs = new Set<() => void>();
const prevenir = () => ecouteurs.forEach((ecouteur) => ecouteur());
const abonner = (ecouteur: () => void) => {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
};

export function publierTitre(titre: string, adresse: string): void {
  if (publie.titre === titre && publie.adresse === adresse) return;
  publie = { titre, adresse };
  prevenir();
}

/** Le titre de la page à cette adresse ; vide tant que son en-tête ne l'a pas publié. */
export function useTitreDeLaPage(adresse: string): string {
  const courant = useSyncExternalStore(abonner, () => publie);
  return courant.adresse === adresse ? courant.titre : '';
}

/** La page donne son propre nom à la dernière étape du fil d'Ariane ; un nom vide le retire. */
export function publierLibelleDuFil(nom: string, adresse: string): void {
  if (libelle.titre === nom && libelle.adresse === adresse) return;
  libelle = { titre: nom, adresse };
  prevenir();
}

/** Le nom que la page de cette adresse donne à la dernière étape du fil d'Ariane (vide : le titre de la page). */
export function useLibelleDuFil(adresse: string): string {
  const courant = useSyncExternalStore(abonner, () => libelle);
  return courant.adresse === adresse ? courant.titre : '';
}
