import { Text } from 'react-native';
import { Checkbox } from '@/shared/components/Checkbox';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { commonStyles } from '@/shared/styles/commonStyles';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/** Organisation › Mon exploitation : ses informations, ses documents d'identification et le choix de l'accueil. */
export default function RubriqueEtablissement() {
  const { settings, patchSettings } = useAppSettings();
  return (
    <Screen>
      <BlocLignes>
        <LigneRubrique
          titre={TEXTES.commun.general.informationsDeLExploitation}
          aide={T.aideInformations}
          icone="business"
          route={ROUTES.INFORMATIONS_EXPLOITATION}
        />
        <LigneRubrique
          titre={TEXTES.identification.titre}
          aide={TEXTES.identification.aide}
          icone="document-attach"
          route={ROUTES.DOCUMENTS_IDENTIFICATION}
        />
      </BlocLignes>
      {/* L'accueil de l'élevage : la ferme en images, ou la liste classique. */}
      <Checkbox
        label={TEXTES.accueil.ferme.reglage.classique}
        value={!!settings.exploitation?.accueilClassique}
        onChange={(classique) => patchSettings({ exploitation: { ...settings.exploitation, accueilClassique: classique || undefined } })}
      />
      <Text style={commonStyles.note}>{TEXTES.accueil.ferme.reglage.aide}</Text>
    </Screen>
  );
}
