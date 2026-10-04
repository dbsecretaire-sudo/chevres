/**
 * Mode de l'établissement actif : « entreprise » (libéral, prestations de service, association) ou, sinon, élevage.
 * Comme les espèces (voir animaux.ts), il est posé à chaque changement d'établissement actif ou de ses types, avant
 * que les écrans ne s'affichent ; les écrans le lisent à l'affichage.
 */
let enModeEntreprise = false;
let activites: readonly string[] = [];

export const modeEntreprise = (): boolean => enModeEntreprise;

/** Les types (libéral, prestations de service, association…) de l'établissement actif. */
export const activitesEtablissement = (): readonly string[] => activites;

export function definirModeEntreprise(valeur: boolean, activitesActives: readonly string[] = []): void {
  enModeEntreprise = valeur;
  activites = activitesActives;
}
