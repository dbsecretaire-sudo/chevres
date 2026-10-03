import { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ExportChoiceModal } from '@/features/export/components/ExportChoiceModal';
import { exporterCheptelExcel } from '@/features/export/xlsxExport';
import { exporterCheptelPdf } from '@/features/export/pdfExport';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { FORMAT_EXPORT, type FormatExport } from '@/shared/constants/export';
import { TEXTES } from '@/shared/textes';

/** Menu discret dans l'en-tête du Cheptel pour les vues secondaires (Naissances, Historique, Bilan) et l'export. */
export function CheptelHeaderMenu() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [choixFormat, setChoixFormat] = useState(false);

  const exporter = async (format: FormatExport) => {
    try {
      if (format === FORMAT_EXPORT.PDF) await exporterCheptelPdf();
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
          // { label: 'Historique', icon: 'time', onPress: () => router.push('/cheptel/historique') },
          {
            label: TEXTES.commun.general.bilanAnnuel,
            icon: 'stats-chart',
            onPress: () => router.push(ROUTES.CHEPTEL_BILAN),
          },
          {
            label: TEXTES.cheptel.cheptelHeaderMenu.exporterLeCheptel,
            icon: 'download',
            onPress: () => setChoixFormat(true),
          },
        ]}
      />
      <ExportChoiceModal
        visible={choixFormat}
        onClose={() => setChoixFormat(false)}
        titre={TEXTES.cheptel.cheptelHeaderMenu.exporterLeCheptel}
        onChoisir={exporter}
      />
    </>
  );
}
