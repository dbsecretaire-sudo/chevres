import { ListeLots } from '@/features/production/screens/ListeLots';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';

/** Les savons au lait de chèvre de l'onglet Production : leur stock, leurs lots et leur dossier réglementaire. */
export default function ListeSavons() {
  return <ListeLots produit={PRODUIT_A_LOTS.SAVON} />;
}
