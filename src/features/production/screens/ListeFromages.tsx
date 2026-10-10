import { ListeLots } from '@/features/production/screens/ListeLots';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';

/** Les fromages de l'onglet Production. */
export default function ListeFromages() {
  return <ListeLots produit={PRODUIT_A_LOTS.FROMAGE} />;
}
