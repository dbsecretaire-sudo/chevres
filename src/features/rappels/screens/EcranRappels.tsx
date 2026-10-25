import { Screen } from '@/shared/components/Screen';
import { BlocRappels } from '@/features/rappels/components/BlocRappels';

/**
 * La page Rappels : ce qui est à valider, en retard et à venir, avec la coche pour valider. L'horloge, en haut, ouvre l'historique des rappels validés.
 */
export default function EcranRappels() {
  return (
    <Screen>
      <BlocRappels />
    </Screen>
  );
}
