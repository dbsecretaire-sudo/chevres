import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { ROUTES } from '@/shared/constants/routes';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { FormField } from '@/shared/components/FormField';
import { ListRow } from '@/shared/components/ListRow';
import { ExportChoiceModal } from '@/features/export/components/ExportChoiceModal';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { pdfsDisponibles, type PdfDisponible } from '@/features/export/services/catalogue';
import { FORMAT_EXPORT, type FormatExport } from '@/shared/constants/export';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/settings/Reglages.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/** Les PDF : le titre imprimé en tête de chacun, puis chaque PDF à part (par activité), à générer d'un appui. */
export default function EcranPdf() {
  const router = useRouter();
  const retour = useAdresseCourante();
  const { settings, patchSettings } = useAppSettings();
  const [titre, setTitre] = useState(settings.exploitation?.titrePdf ?? '');
  const [enCours, setEnCours] = useState<string | null>(null);
  /** Le document dont on choisit le format (PDF ou Excel), quand il existe dans les deux. */
  const [choix, setChoix] = useState<PdfDisponible | null>(null);

  const enregistrerTitre = () =>
    patchSettings({ exploitation: { ...settings.exploitation, titrePdf: titre.trim() || undefined } });

  const generer = async (id: string, lancer: (annee: number) => Promise<void>) => {
    setEnCours(id);
    try {
      await lancer(settings.anneeActive);
    } catch (e: any) {
      Alert.alert(TEXTES.commun.general.erreurExport, e?.message ?? String(e));
    } finally {
      setEnCours(null);
    }
  };

  const choisirFormat = (format: FormatExport) => {
    const pdf = choix;
    setChoix(null);
    if (pdf) generer(pdf.id, format === FORMAT_EXPORT.PDF ? pdf.generer : (pdf.genererExcel ?? pdf.generer));
  };

  const pdfs = pdfsDisponibles();
  return (
    <Screen>
      <SectionForm titre={T.titrePdf} aide={T.titrePdfAide}>
        <FormField
          value={titre}
          onChangeText={setTitre}
          onBlur={enregistrerTitre}
          placeholder={T.titrePdfExemple}
          accessibilityLabel={T.titrePdf}
        />
      </SectionForm>

      <Text style={styles.titreGroupe}>{T.autresPdf}</Text>
      <SelecteurEspece />
      <View style={commonStyles.gap10}>
        {pdfs.length === 0 ? <Text style={commonStyles.note}>{T.aucunPdf}</Text> : null}
        {pdfs.map((pdf) => (
          <ListRow
            key={pdf.id}
            title={pdf.titre}
            subtitle={enCours === pdf.id ? T.generationEnCours : pdf.aide}
            trailing={<Ionicons name="document-text" size={24} color={colors.primary} />}
            onPress={
              enCours ? undefined : () => (pdf.genererExcel ? setChoix(pdf) : generer(pdf.id, pdf.generer))
            }
          />
        ))}
      </View>
      {/* Les PDF déjà générés : un historique, qu'on peut rouvrir. */}
      <ListRow
        title={TEXTES.export.bibliotheque.bouton}
        subtitle={TEXTES.export.bibliotheque.aide}
        trailing={<Ionicons name="time" size={24} color={colors.primary} />}
        onPress={() => router.push(ROUTES.bibliothequeDepuis(retour) as never)}
      />
      <ExportChoiceModal
        visible={choix !== null}
        onClose={() => setChoix(null)}
        titre={choix?.titre ?? ''}
        onChoisir={choisirFormat}
      />
    </Screen>
  );
}
