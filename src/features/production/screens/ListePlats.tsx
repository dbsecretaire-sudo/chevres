import { ListeLots } from '@/features/production/screens/ListeLots';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';

/** Les plats préparés de l'onglet Production : leur stock et leurs lots. */
export default function ListePlats() {
  return <ListeLots produit={PRODUIT_A_LOTS.PLAT} />;
}
