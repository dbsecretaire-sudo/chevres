import { useState } from 'react';
import { Alert } from 'react-native';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { exporterAnneeExcel } from '@/features/export/xlsxExport';
import { exporterAnneePdf } from '@/features/export/pdfExport';
import { exporterSauvegardeLocale, importerSauvegardeLocale } from '@/features/sauvegarde/backup';
import { FORMAT_EXPORT, type FormatExport } from '@/shared/constants/export';
import { TEXTES } from '@/shared/textes';

/** Export de l'année (PDF / Excel) et sauvegarde locale (export / restauration). */
export function useExportEtSauvegarde() {
  const { settings } = useAppSettings();

  const [exportEnCours, setExportEnCours] = useState(false);
  const [choixFormat, setChoixFormat] = useState(false);

  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [importEnCours, setImportEnCours] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [resultatImport, setResultatImport] = useState<{ titre: string; message: string } | null>(null);

  const exporter = async (format: FormatExport) => {
    setExportEnCours(true);
    try {
      if (format === FORMAT_EXPORT.PDF) await exporterAnneePdf(settings.anneeActive);
      else await exporterAnneeExcel(settings.anneeActive);
    } catch (e: any) {
      Alert.alert(TEXTES.commun.general.erreurExport, e?.message ?? String(e));
    } finally {
      setExportEnCours(false);
    }
  };

  const exporterSauvegarde = async () => {
    setSauvegardeEnCours(true);
    try {
      await exporterSauvegardeLocale();
    } catch (e: any) {
      Alert.alert(TEXTES.settings.reglages.erreurDeSauvegarde, e?.message ?? String(e));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const importerSauvegarde = async () => {
    setConfirmImport(false);
    setImportEnCours(true);
    try {
      const resultat = await importerSauvegardeLocale();
      if (resultat.annule) return;
      setResultatImport({
        titre: TEXTES.settings.reglages.sauvegardeRestauree,
        message: TEXTES.settings.reglages.animauxAnimalAnimauxFournisseursFournisseur(
          resultat.animaux,
          resultat.fournisseurs,
          resultat.clients,
          resultat.comptesPcg,
        ),
      });
    } catch (e: any) {
      setResultatImport({ titre: TEXTES.settings.reglages.erreurDImport, message: e?.message ?? String(e) });
    } finally {
      setImportEnCours(false);
    }
  };

  return {
    exportEnCours,
    choixFormat,
    setChoixFormat,
    exporter,
    sauvegardeEnCours,
    importEnCours,
    confirmImport,
    setConfirmImport,
    resultatImport,
    setResultatImport,
    exporterSauvegarde,
    importerSauvegarde,
  };
}
