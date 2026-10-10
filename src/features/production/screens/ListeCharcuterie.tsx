import { ListeLots } from '@/features/production/screens/ListeLots';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';

/** La boucherie / charcuterie de l'onglet Production. */
export default function ListeCharcuterie() {
  return <ListeLots produit={PRODUIT_A_LOTS.CHARCUTERIE} />;
}
