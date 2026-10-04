import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { ExportChoiceModal } from '@/features/export/components/ExportChoiceModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { useExportEtSauvegarde } from '@/features/settings/hooks/useExportEtSauvegarde';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Donnees = ReturnType<typeof useExportEtSauvegarde>;

/** Carte d'export de l'année (PDF / Excel). */
export function CarteExport({ d }: { d: Donnees }) {
  const { settings } = useAppSettings();

  return (
    <>
      <Card>
        <Text style={commonStyles.cardTitle}>{TEXTES.settings.reglages.export}</Text>
        <Text style={commonStyles.muted}>
          {TEXTES.settings.reglages.descriptionExport(settings.anneeActive)}
        </Text>
        <Button
          label={TEXTES.settings.reglages.exporter}
          onPress={() => d.setChoixFormat(true)}
          loading={d.exportEnCours}
        />
      </Card>
      <ExportChoiceModal
        visible={d.choixFormat}
        onClose={() => d.setChoixFormat(false)}
        titre={TEXTES.settings.reglages.exportAnneeactive(settings.anneeActive)}
        onChoisir={d.exporter}
      />
    </>
  );
}

/** Carte de sauvegarde locale (export / restauration de toutes les données). */
export function CarteSauvegarde({ d }: { d: Donnees }) {
  return (
    <>
      <Card>
        <Text style={commonStyles.cardTitle}>{TEXTES.settings.reglages.sauvegardeLocale}</Text>
        <Text style={commonStyles.muted}>{TEXTES.settings.reglages.exporteToutesLesDonneesDe}</Text>
        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            label={TEXTES.settings.reglages.exporter}
            onPress={d.exporterSauvegarde}
            loading={d.sauvegardeEnCours}
          />
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={TEXTES.settings.reglages.importer}
            onPress={() => d.setConfirmImport(true)}
            loading={d.importEnCours}
          />
        </View>
      </Card>
      <ConfirmModal
        visible={d.confirmImport}
        title={TEXTES.settings.reglages.restaurerUneSauvegardeQuestion}
        message={TEXTES.settings.reglages.toutesLesDonneesActuellementEnregistrees}
        confirmLabel={TEXTES.settings.reglages.choisirLeFichier}
        onCancel={() => d.setConfirmImport(false)}
        onConfirm={d.importerSauvegarde}
      />
      <InfoModal
        visible={!!d.resultatImport}
        title={d.resultatImport?.titre ?? ''}
        message={d.resultatImport?.message}
        onClose={() => d.setResultatImport(null)}
      />
    </>
  );
}
