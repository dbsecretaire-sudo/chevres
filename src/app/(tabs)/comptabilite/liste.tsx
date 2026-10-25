import { ExigerConnexion } from '@/features/sync/ExigerConnexion';
import ListeTransactions from '@/features/comptabilite/screens/ListeTransactions';

/** Les écritures (l'argent) : seulement avec le compte de la ferme, même depuis le mode normal. */
export default function Liste() {
  return (
    <ExigerConnexion>
      <ListeTransactions />
    </ExigerConnexion>
  );
}
