import { Screen } from '@/shared/components/Screen';
import { CarteExport } from '@/features/settings/components/CartesDonnees';
import { useExportEtSauvegarde } from '@/features/settings/hooks/useExportEtSauvegarde';

/** L'export du rapport de l'année active (PDF ou Excel), sur son propre écran. */
export default function EcranExport() {
  const donnees = useExportEtSauvegarde();
  return (
    <Screen>
      <CarteExport d={donnees} />
    </Screen>
  );
}
