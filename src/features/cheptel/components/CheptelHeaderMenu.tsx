import { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ExportChoiceModal } from '@/features/export/components/ExportChoiceModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { exporterCheptelExcel, exporterExploitationExcel } from '@/features/export/xlsxExport';
import { exporterCheptelPdf, exporterExploitationPdf } from '@/features/export/pdfExport';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { FORMAT_EXPORT, type FormatExport } from '@/shared/constants/export';
import { TEXTES } from '@/shared/textes';

/** Ce qu'on exporte depuis le menu : le registre du cheptel, ou le rapport d'exploitation de l'année. */
type Export = 'cheptel' | 'exploitation';

/**
 * Menu (burger) de l'en-tête du Cheptel : vues secondaires (bilan, visites vétérinaires, contrôles,
 * alimentation) et exports.
 */
export function CheptelHeaderMenu() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const [ouvert, setOuvert] = useState(false);
  const [exportChoisi, setExportChoisi] = useState<Export | null>(null);

  const aller = (route: string) => () => router.push(route as never);

  const exporter = async (format: FormatExport) => {
    const pdf = format === FORMAT_EXPORT.PDF;
    try {
      if (exportChoisi === 'exploitation') {
        if (pdf) await exporterExploitationPdf(settings.anneeActive);
        else await exporterExploitationExcel(settings.anneeActive);
      } else if (pdf) await exporterCheptelPdf();
      else await exporterCheptelExcel();
    } catch (e: any) {
      Alert.alert(TEXTES.commun.general.erreurExport, e?.message ?? String(e));
    }
  };

  return (
    <>
      <Pressable style={commonStyles.boutonCompact} onPress={() => setOuvert(true)}>
        <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
      </Pressable>
      <OptionsModal
        visible={ouvert}
        onClose={() => setOuvert(false)}
        title={TEXTES.cheptel.cheptelHeaderMenu.autresVues}
        options={[
          {
            label: TEXTES.commun.general.bilanAnnuel,
            icon: 'stats-chart',
            onPress: aller(ROUTES.CHEPTEL_BILAN),
          },
          {
            label: TEXTES.commun.general.visitesVeterinaire,
            icon: 'medkit',
            onPress: aller(ROUTES.CHEPTEL_VETERINAIRE),
          },
          {
            label: TEXTES.commun.general.controles,
            icon: 'checkmark-circle',
            onPress: aller(ROUTES.CHEPTEL_CONTROLES),
          },
          {
            label: TEXTES.commun.general.alimentation,
            icon: 'nutrition',
            onPress: aller(ROUTES.CHEPTEL_ALIMENTATION),
          },
          {
            label: TEXTES.cheptel.cheptelHeaderMenu.exporterLeCheptel,
            icon: 'download',
            onPress: () => setExportChoisi('cheptel'),
          },
          {
            label: TEXTES.exploitation.exploitationHeaderMenu.exporterLeRapportAnneeactive(
              settings.anneeActive,
            ),
            icon: 'download',
            onPress: () => setExportChoisi('exploitation'),
          },
        ]}
      />
      <ExportChoiceModal
        visible={exportChoisi !== null}
        onClose={() => setExportChoisi(null)}
        titre={
          exportChoisi === 'exploitation'
            ? TEXTES.exploitation.exploitationHeaderMenu.rapportAnneeactive(settings.anneeActive)
            : TEXTES.cheptel.cheptelHeaderMenu.exporterLeCheptel
        }
        onChoisir={exporter}
      />
    </>
  );
}
