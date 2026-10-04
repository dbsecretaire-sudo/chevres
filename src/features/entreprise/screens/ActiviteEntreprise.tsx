import ExplorateurClients from '@/features/dossiers/screens/ExplorateurClients';
import ActivitesAssociation from '@/features/gite/screens/ActivitesAssociation';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';

/**
 * L'onglet Activité d'une entreprise : la gestion du gîte et de ses activités pour une association, l'explorateur de
 * clients et de dossiers pour les autres (prestations de service, libéral).
 */
export default function ActiviteEntreprise() {
  return activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION) ? (
    <ActivitesAssociation />
  ) : (
    <ExplorateurClients />
  );
}
