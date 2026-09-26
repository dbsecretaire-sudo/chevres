import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from './OptionsModal';
import { ExportChoiceModal } from './ExportChoiceModal';
import { exporterCheptelExcel } from '@/utils/xlsxExport';
import { exporterCheptelPdf } from '@/utils/pdfExport';

/** Menu discret dans l'en-tête du Cheptel pour les vues secondaires (Naissances, Historique, Bilan) et l'export. */
export function CheptelHeaderMenu() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [choixFormat, setChoixFormat] = useState(false);

  const exporter = async (format: 'pdf' | 'xlsx') => {
    try {
      if (format === 'pdf') await exporterCheptelPdf();
      else await exporterCheptelExcel();
    } catch (e: any) {
      Alert.alert('Erreur export', e?.message ?? String(e));
    }
  };

  return (
    <>
      <Pressable style={styles.bouton} onPress={() => setOuvert(true)}>
        <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
      </Pressable>
      <OptionsModal
        visible={ouvert}
        onClose={() => setOuvert(false)}
        title="Autres vues"
        options={[
          { label: 'Naissances', icon: 'paw', onPress: () => router.push('/cheptel/naissances') },
          { label: 'Historique', icon: 'time', onPress: () => router.push('/cheptel/historique') },
          { label: 'Bilan annuel', icon: 'stats-chart', onPress: () => router.push('/cheptel/bilan') },
          { label: 'Exporter le cheptel', icon: 'download', onPress: () => setChoixFormat(true) },
        ]}
      />
      <ExportChoiceModal
        visible={choixFormat}
        onClose={() => setChoixFormat(false)}
        titre="Exporter le cheptel"
        onChoisir={exporter}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bouton: { paddingHorizontal: 12, paddingVertical: 6 },
});
