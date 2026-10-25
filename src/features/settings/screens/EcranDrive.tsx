import { Screen } from '@/shared/components/Screen';
import { CarteSynchronisation } from '@/features/settings/components/CarteSynchronisation';

/** La synchronisation avec le serveur de la ferme, sur son propre écran (l'adresse de cet écran ne change pas). */
export default function EcranDrive() {
  return (
    <Screen>
      <CarteSynchronisation />
    </Screen>
  );
}
