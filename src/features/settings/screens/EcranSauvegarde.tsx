import { Screen } from '@/shared/components/Screen';
import { CarteSauvegarde } from '@/features/settings/components/CartesDonnees';
import { useExportEtSauvegarde } from '@/features/settings/hooks/useExportEtSauvegarde';

/** La sauvegarde locale (exporter ou importer toutes les données), sur son propre écran. */
export default function EcranSauvegarde() {
  const donnees = useExportEtSauvegarde();
  return (
    <Screen>
      <CarteSauvegarde d={donnees} />
    </Screen>
  );
}
