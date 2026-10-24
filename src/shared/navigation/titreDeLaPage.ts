import { useSyncExternalStore } from 'react';

/** Le nom que la page donne elle-même à la dernière étape du fil d'Ariane (la fiche d'un contact : le nom du contact, à la place de « Contact »). */
interface Libelle {
  titre: string;
  /** La page à laquelle il appartient : un nom resté d'une page précédente n'est pas montré. */
  adresse: string;
}

let libelle: Libelle = { titre: '', adresse: '' };
const ecouteurs = new Set<() => void>();
const abonner = (ecouteur: () => void) => {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
};

/** La page donne son propre nom à la dernière étape du fil d'Ariane ; un nom vide le retire. */
export function publierLibelleDuFil(nom: string, adresse: string): void {
  if (libelle.titre === nom && libelle.adresse === adresse) return;
  libelle = { titre: nom, adresse };
  ecouteurs.forEach((ecouteur) => ecouteur());
}

/** Le nom que la page de cette adresse donne à la dernière étape du fil d'Ariane (vide : le titre de la page). */
export function useLibelleDuFil(adresse: string): string {
  const courant = useSyncExternalStore(abonner, () => libelle);
  return courant.adresse === adresse ? courant.titre : '';
}
