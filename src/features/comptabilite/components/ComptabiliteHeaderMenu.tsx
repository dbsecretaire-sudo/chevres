import { useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ExportChoiceModal } from '@/features/export/components/ExportChoiceModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { exporterPlanComptableExcel } from '@/features/export/xlsxExport';
import { exporterPlanComptablePdf } from '@/features/export/pdfExport';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { FORMAT_EXPORT, type FormatExport } from '@/shared/constants/export';
import { TEXTES } from '@/shared/textes';

/** Menu discret dans l'en-tête de Comptabilité : plan comptable, impôts, RSA. */
export function ComptabiliteHeaderMenu() {
  const router = useRouter();
  const { settings } = useAppSettings();
  useEtablissement();
  const entreprise = modeEntreprise();
  const tvaApplicable = !!settings.exploitation?.entreprise?.tvaApplicable;
  const [ouvert, setOuvert] = useState(false);
  const [choixFormat, setChoixFormat] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const exporterPlanComptable = async (format: FormatExport) => {
    try {
      if (format === FORMAT_EXPORT.PDF) await exporterPlanComptablePdf(settings.anneeActive);
      else await exporterPlanComptableExcel(settings.anneeActive);
    } catch (e: any) {
      setErreur(e?.message ?? String(e));
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
        title={TEXTES.commun.general.comptabilite}
        options={[
          {
            label: TEXTES.commun.general.detail,
            icon: 'bar-chart',
            onPress: () => router.push(ROUTES.COMPTABILITE_DETAIL),
          },
          {
            label: TEXTES.commun.general.fournisseurs,
            icon: 'people',
            onPress: () => router.push(ROUTES.FOURNISSEURS),
          },
          {
            label: TEXTES.commun.general.clients,
            icon: 'person',
            onPress: () => router.push(ROUTES.CLIENTS),
          },
          {
            label: TEXTES.commun.general.comptesPcg,
            icon: 'list',
            onPress: () => router.push(ROUTES.COMPTES_PCG),
          },
          {
            label: TEXTES.comptabilite.comptabiliteHeaderMenu.genererUnPlanComptable,
            icon: 'document-text',
            onPress: () => setChoixFormat(true),
          },
          {
            label: entreprise ? TEXTES.entreprise.menu.impots : TEXTES.commun.general.impotsMicroBa,
            icon: 'receipt',
            onPress: () => router.push(ROUTES.FISCALITE_IMPOTS),
          },
          {
            label: entreprise ? TEXTES.entreprise.menu.chiffreAffaires : TEXTES.commun.general.declarationRsa,
            icon: 'calendar',
            onPress: () => router.push(ROUTES.FISCALITE_RSA),
          },
          // Les déclarations URSSAF : pour une entreprise.
          ...(entreprise
            ? [
                {
                  label: TEXTES.entreprise.menu.urssaf,
                  icon: 'cash' as const,
                  onPress: () => router.push(ROUTES.URSSAF),
                },
              ]
            : []),
          // La TVA n'apparaît que pour une entreprise assujettie.
          ...(entreprise && tvaApplicable
            ? [
                {
                  label: TEXTES.entreprise.menu.tva,
                  icon: 'calculator' as const,
                  onPress: () => router.push(ROUTES.TVA),
                },
              ]
            : []),
        ]}
      />
      <ExportChoiceModal
        visible={choixFormat}
        onClose={() => setChoixFormat(false)}
        titre={TEXTES.commun.general.planComptable}
        onChoisir={exporterPlanComptable}
      />
      <InfoModal
        visible={!!erreur}
        title={TEXTES.commun.general.erreurExport}
        message={erreur ?? undefined}
        onClose={() => setErreur(null)}
      />
    </>
  );
}
