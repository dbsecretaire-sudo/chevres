import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { ListRow } from '@/shared/components/ListRow';
import { ExportChoiceModal } from '@/features/export/components/ExportChoiceModal';
import { exporterPlanComptablePdf } from '@/features/export/pdfExport';
import { exporterPlanComptableExcel } from '@/features/export/xlsxExport';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { FORMAT_EXPORT, type FormatExport } from '@/shared/constants/export';
import { ROUTES } from '@/shared/constants/routes';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.fiscalite;

type IconeNom = keyof typeof Ionicons.glyphMap;

/**
 * La fiscalité, au même endroit : les impôts, la déclaration du chiffre d'affaires (RSA pour un élevage), les déclarations
 * URSSAF et de TVA d'une entreprise, et le plan comptable de l'année à générer.
 */
export default function Fiscalite() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const entreprise = modeEntreprise();
  const tvaApplicable = !!settings.exploitation?.entreprise?.tvaApplicable;
  const [choixFormat, setChoixFormat] = useState(false);

  const exporterPlanComptable = async (format: FormatExport) => {
    try {
      if (format === FORMAT_EXPORT.PDF) await exporterPlanComptablePdf(settings.anneeActive);
      else await exporterPlanComptableExcel(settings.anneeActive);
    } catch (e: any) {
      Alert.alert(TEXTES.commun.general.erreurExport, e?.message ?? String(e));
    }
  };

  const ligne = (titre: string, aide: string, icone: IconeNom, onPress: () => void) => (
    <ListRow
      key={titre}
      title={titre}
      subtitle={aide}
      trailing={<Ionicons name={icone} size={24} color={colors.primary} />}
      onPress={onPress}
    />
  );

  return (
    <Screen>
      <View style={commonStyles.gap10}>
        {ligne(
          entreprise ? TEXTES.entreprise.menu.impots : TEXTES.commun.general.impotsMicroBa,
          T.aideImpots,
          'receipt',
          () => router.push(ROUTES.FISCALITE_IMPOTS),
        )}
        {ligne(
          entreprise ? TEXTES.entreprise.menu.chiffreAffaires : TEXTES.commun.general.declarationRsa,
          T.aideChiffreAffaires,
          'calendar',
          () => router.push(ROUTES.FISCALITE_RSA),
        )}
        {entreprise
          ? ligne(TEXTES.entreprise.menu.urssaf, T.aideUrssaf, 'cash', () => router.push(ROUTES.URSSAF))
          : null}
        {entreprise && tvaApplicable
          ? ligne(TEXTES.entreprise.menu.tva, T.aideTva, 'calculator', () => router.push(ROUTES.TVA))
          : null}
        {ligne(TEXTES.commun.general.planComptable, T.aidePlanComptable, 'document-text', () =>
          setChoixFormat(true),
        )}
      </View>
      <ExportChoiceModal
        visible={choixFormat}
        onClose={() => setChoixFormat(false)}
        titre={TEXTES.commun.general.planComptable}
        onChoisir={exporterPlanComptable}
      />
    </Screen>
  );
}
