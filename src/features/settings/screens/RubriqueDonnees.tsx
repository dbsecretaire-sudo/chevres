import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/** Organisation › Mes données : l'export, la sauvegarde sur l'appareil et la synchronisation avec Google Drive. */
export default function RubriqueDonnees() {
  const { settings } = useAppSettings();
  return (
    <Screen>
      <BlocLignes>
        <LigneRubrique
          titre={T.export}
          aide={T.aideExport(settings.anneeActive)}
          icone="download"
          route={ROUTES.EXPORT_DONNEES}
        />
        <LigneRubrique titre={T.pdf} aide={T.aidePdf} icone="document-text" route={ROUTES.PDF_DONNEES} />
        <LigneRubrique
          titre={T.sauvegardeLocale}
          aide={T.aideSauvegarde}
          icone="save"
          route={ROUTES.SAUVEGARDE_LOCALE}
        />
        <LigneRubrique
          titre={T.googleDrive}
          aide={T.aideDrive}
          icone="cloud-upload"
          route={ROUTES.GOOGLE_DRIVE}
        />
      </BlocLignes>
    </Screen>
  );
}
