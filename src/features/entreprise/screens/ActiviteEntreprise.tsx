import ExplorateurClients from '@/features/dossiers/screens/ExplorateurClients';
import ActivitesAssociation from '@/features/gite/screens/ActivitesAssociation';
import JournalTrading from '@/features/trading/screens/JournalTrading';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';

/**
 * L'onglet Activité d'une entreprise : la gestion du gîte et de ses activités pour une association, le journal de
 * trading pour une activité financière seule, l'explorateur de clients et de dossiers pour les autres (prestations de
 * service). Quand plusieurs activités se combinent, les autres écrans sont proposés par le menu ou les tuiles.
 */
export default function ActiviteEntreprise() {
  const activites = activitesEtablissement();
  if (activites.includes(ACTIVITE_SOCIETE.ASSOCIATION)) return <ActivitesAssociation />;
  if (
    activites.includes(ACTIVITE_SOCIETE.LIBERAL) &&
    !activites.includes(ACTIVITE_SOCIETE.PRESTATIONS_SERVICE)
  ) {
    return <JournalTrading />;
  }
  return <ExplorateurClients />;
}
