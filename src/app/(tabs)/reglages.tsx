import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { InfoModal } from '@/components/InfoModal';
import { colors } from '@/theme/colors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { exporterAnneeExcel } from '@/utils/xlsxExport';
import { exporterAnneePdf } from '@/utils/pdfExport';
import { exporterSauvegardeLocale, importerSauvegardeLocale } from '@/utils/backup';
import { ExportChoiceModal } from '@/components/ExportChoiceModal';
import {
  disconnectGoogle,
  getValidAccessToken,
  isGoogleConnected,
  isSecureStoreAvailable,
  signInWithGoogle,
} from '@/drive/googleAuth';
import { ensureRootFolder, pousserToutesAnnees, tirerToutesAnnees } from '@/drive/sync';

export default function Reglages() {
  const { settings, patchSettings } = useAppSettings();
  const [exportEnCours, setExportEnCours] = useState(false);
  const [choixFormat, setChoixFormat] = useState(false);

  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [importEnCours, setImportEnCours] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [resultatImport, setResultatImport] = useState<{ titre: string; message: string } | null>(null);

  const [connecte, setConnecte] = useState(false);
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [syncEnCours, setSyncEnCours] = useState<'push' | 'pull' | null>(null);
  const [syncEtape, setSyncEtape] = useState('');

  const charger = useCallback(async () => {
    setConnecte(await isGoogleConnected());
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const seConnecter = async () => {
    setConnexionEnCours(true);
    try {
      const resultat = await signInWithGoogle();
      if (!resultat) return; // annulé par l'utilisateur
      const folderId = await ensureRootFolder(resultat.accessToken);
      await patchSettings({
        driveAccountEmail: resultat.email,
        driveFolderId: folderId,
        driveFolderName: 'Troupeau Chèvres',
      });
      setConnecte(true);
      Alert.alert('Connecté', `Connecté à Google Drive (${resultat.email}).`);
    } catch (e: any) {
      Alert.alert('Erreur de connexion', e?.message ?? String(e));
    } finally {
      setConnexionEnCours(false);
    }
  };

  const seDeconnecter = async () => {
    await disconnectGoogle();
    await patchSettings({ driveAccountEmail: undefined, driveFolderId: undefined });
    setConnecte(false);
  };

  const synchroniser = async (sens: 'push' | 'pull') => {
    if (!settings.driveFolderId) return;
    setSyncEnCours(sens);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        Alert.alert('Session expirée', 'Merci de vous reconnecter à Google Drive.');
        setConnecte(false);
        return;
      }
      const onProgress = (annee: number, categorie: string) => setSyncEtape(`${categorie} ${annee}`);
      if (sens === 'push') {
        await pousserToutesAnnees(accessToken, settings.driveFolderId, onProgress);
      } else {
        await tirerToutesAnnees(accessToken, settings.driveFolderId, onProgress);
      }
      await patchSettings({ derniereSynchronisation: new Date().toISOString() });
      Alert.alert('Terminé', sens === 'push' ? 'Données envoyées vers Google Drive.' : 'Données récupérées depuis Google Drive.');
      charger();
    } catch (e: any) {
      Alert.alert('Erreur de synchronisation', e?.message ?? String(e));
    } finally {
      setSyncEnCours(null);
      setSyncEtape('');
    }
  };

  const exporter = async (format: 'pdf' | 'xlsx') => {
    setExportEnCours(true);
    try {
      if (format === 'pdf') await exporterAnneePdf(settings.anneeActive);
      else await exporterAnneeExcel(settings.anneeActive);
    } catch (e: any) {
      Alert.alert('Erreur export', e?.message ?? String(e));
    } finally {
      setExportEnCours(false);
    }
  };

  const exporterSauvegarde = async () => {
    setSauvegardeEnCours(true);
    try {
      await exporterSauvegardeLocale();
    } catch (e: any) {
      Alert.alert('Erreur de sauvegarde', e?.message ?? String(e));
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
        titre: 'Sauvegarde restaurée',
        message: `${resultat.animaux} animal/animaux et ${resultat.fournisseurs} fournisseur(s) importés.`,
      });
    } catch (e: any) {
      setResultatImport({ titre: 'Erreur d’import', message: e?.message ?? String(e) });
    } finally {
      setImportEnCours(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.cardTitle}>Export</Text>
        <Text style={styles.muted}>
          Génère un rapport (cheptel, ventes, factures, visites, contrôles) pour l’année {settings.anneeActive},
          en PDF ou en Excel, prêt à partager ou envoyer à la comptabilité.
        </Text>
        <Button label="Exporter" onPress={() => setChoixFormat(true)} loading={exportEnCours} />
      </Card>
      <ExportChoiceModal
        visible={choixFormat}
        onClose={() => setChoixFormat(false)}
        titre={`Export ${settings.anneeActive}`}
        onChoisir={exporter}
      />

      <Card>
        <Text style={styles.cardTitle}>Sauvegarde locale</Text>
        <Text style={styles.muted}>
          Exporte toutes les données de l’appli (toutes années, cheptel, ventes, factures, visites,
          contrôles, fournisseurs) dans un seul fichier à conserver ailleurs (mail, stockage…) — permet
          de tout récupérer après une réinstallation, sans passer par Google Drive.
        </Text>
        <View style={styles.row}>
          <Button
            style={styles.flex1}
            label="Exporter"
            onPress={exporterSauvegarde}
            loading={sauvegardeEnCours}
          />
          <Button
            style={styles.flex1}
            variant="secondary"
            label="Importer"
            onPress={() => setConfirmImport(true)}
            loading={importEnCours}
          />
        </View>
      </Card>
      <ConfirmModal
        visible={confirmImport}
        title="Restaurer une sauvegarde ?"
        message="Toutes les données actuellement enregistrées sur cet appareil (cheptel, ventes, factures, visites, contrôles, fournisseurs) seront remplacées par celles du fichier choisi. Cette action est irréversible."
        confirmLabel="Choisir le fichier"
        onCancel={() => setConfirmImport(false)}
        onConfirm={importerSauvegarde}
      />
      <InfoModal
        visible={!!resultatImport}
        title={resultatImport?.titre ?? ''}
        message={resultatImport?.message}
        onClose={() => setResultatImport(null)}
      />

      <Card>
        <Text style={styles.cardTitle}>Google Drive</Text>
        <Text style={styles.muted}>
          Synchronise les fichiers texte (cheptel, ventes, factures, visites vétérinaire, contrôles) dans un dossier
          « Troupeau Chèvres » sur Google Drive, pour partager les données entre plusieurs appareils.
        </Text>

        {!isSecureStoreAvailable() && (
          <Text style={styles.warning}>La synchronisation Google Drive n’est pas disponible sur le web — utilisez l’application mobile.</Text>
        )}

        {isSecureStoreAvailable() && !connecte && (
          <Button label="Se connecter à Google Drive" onPress={seConnecter} loading={connexionEnCours} />
        )}

        {isSecureStoreAvailable() && connecte && (
          <View style={styles.gap}>
            <Text style={styles.line}>Compte : {settings.driveAccountEmail ?? '—'}</Text>
            <Text style={styles.line}>Dossier : {settings.driveFolderName ?? 'Troupeau Chèvres'}</Text>
            <Text style={styles.muted}>
              {settings.derniereSynchronisation
                ? `Dernière synchronisation : ${new Date(settings.derniereSynchronisation).toLocaleString('fr-FR')}`
                : 'Jamais synchronisé'}
            </Text>
            {syncEnCours && <Text style={styles.muted}>En cours… {syncEtape}</Text>}
            <View style={styles.row}>
              <Button
                style={styles.flex1}
                label="Envoyer vers Drive"
                onPress={() => synchroniser('push')}
                loading={syncEnCours === 'push'}
                disabled={!!syncEnCours}
              />
              <Button
                style={styles.flex1}
                variant="secondary"
                label="Récupérer depuis Drive"
                onPress={() => synchroniser('pull')}
                loading={syncEnCours === 'pull'}
                disabled={!!syncEnCours}
              />
            </View>
            <Button label="Se déconnecter" variant="danger" onPress={seDeconnecter} />
          </View>
        )}
      </Card>

      <Text style={styles.footer}>Troupeau Chèvres — toutes les données restent d’abord enregistrées sur cet appareil.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  warning: { fontSize: 13, color: colors.danger },
  line: { fontSize: 14, color: colors.text },
  gap: { gap: 10 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  footer: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});
