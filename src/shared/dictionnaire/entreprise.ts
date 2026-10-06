import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';

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

/** Vrai si l'établissement a une activité financière (journal de trading). */
export const avecActiviteFinanciere = (): boolean => activites.includes(ACTIVITE_SOCIETE.LIBERAL);

/** Vrai si l'activité financière est la seule activité de l'établissement. */
export const activiteFinanciereSeule = (): boolean =>
  activites.length > 0 && activites.every((a) => a === ACTIVITE_SOCIETE.LIBERAL);

export function definirModeEntreprise(valeur: boolean, activitesActives: readonly string[] = []): void {
  enModeEntreprise = valeur;
  activites = activitesActives;
}
