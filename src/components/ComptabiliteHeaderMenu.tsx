import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from './OptionsModal';
import { ExportChoiceModal } from './ExportChoiceModal';
import { useAppSettings } from '@/context/AppSettingsContext';
import { exporterPlanComptableExcel } from '@/utils/xlsxExport';
import { exporterPlanComptablePdf } from '@/utils/pdfExport';

/** Menu discret dans l'en-tête de Comptabilité : plan comptable, impôts, RSA. */
export function ComptabiliteHeaderMenu() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const [ouvert, setOuvert] = useState(false);
  const [choixFormat, setChoixFormat] = useState(false);

  const exporterPlanComptable = async (format: 'pdf' | 'xlsx') => {
    try {
      if (format === 'pdf') await exporterPlanComptablePdf(settings.anneeActive);
      else await exporterPlanComptableExcel(settings.anneeActive);
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
        title="Comptabilité"
        options={[
          { label: 'Générer un plan comptable', icon: 'document-text', onPress: () => setChoixFormat(true) },
          { label: 'Impôts (micro-BA)', icon: 'receipt', onPress: () => router.push('/comptabilite/fiscalite-impots') },
          { label: 'Déclaration RSA', icon: 'calendar', onPress: () => router.push('/comptabilite/fiscalite-rsa') },
        ]}
      />
      <ExportChoiceModal
        visible={choixFormat}
        onClose={() => setChoixFormat(false)}
        titre="Plan comptable"
        onChoisir={exporterPlanComptable}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bouton: { paddingHorizontal: 12, paddingVertical: 6 },
});
