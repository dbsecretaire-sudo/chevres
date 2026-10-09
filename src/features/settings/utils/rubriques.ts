import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';

/** L'inventaire existe pour un élevage et pour un gîte (pas pour un secrétariat ni une activité financière). */
export const inventaireAccessible = (): boolean =>
  !modeEntreprise() || activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);
