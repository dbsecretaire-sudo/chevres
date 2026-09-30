import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from './OptionsModal';
import { ExportChoiceModal } from './ExportChoiceModal';
import { InfoModal } from './InfoModal';
import { useAppSettings } from '@/context/AppSettingsContext';
import { exporterPlanComptableExcel } from '@/utils/xlsxExport';
import { exporterPlanComptablePdf } from '@/utils/pdfExport';

/** Menu discret dans l'en-tête de Comptabilité : plan comptable, impôts, RSA. */
export function ComptabiliteHeaderMenu() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const [ouvert, setOuvert] = useState(false);
  const [choixFormat, setChoixFormat] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const exporterPlanComptable = async (format: 'pdf' | 'xlsx') => {
    try {
      if (format === 'pdf') await exporterPlanComptablePdf(settings.anneeActive);
      else await exporterPlanComptableExcel(settings.anneeActive);
    } catch (e: any) {
      setErreur(e?.message ?? String(e));
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
          { label: 'Détail', icon: 'bar-chart', onPress: () => router.push('/comptabilite/detail') },
          { label: 'Fournisseurs', icon: 'people', onPress: () => router.push('/comptabilite/fournisseurs') },
          { label: 'Clients', icon: 'person', onPress: () => router.push('/comptabilite/clients') },
          { label: 'Comptes PCG', icon: 'list', onPress: () => router.push('/comptabilite/comptes-pcg') },
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
      <InfoModal
        visible={!!erreur}
        title="Erreur export"
        message={erreur ?? undefined}
        onClose={() => setErreur(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bouton: { paddingHorizontal: 12, paddingVertical: 6 },
});
