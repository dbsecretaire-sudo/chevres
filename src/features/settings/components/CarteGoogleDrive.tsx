import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { useGoogleDrive } from '@/features/settings/hooks/useGoogleDrive';
import { isSecureStoreAvailable } from '@/features/drive/googleAuth';
import { LOCALE } from '@/shared/constants/format';
import { styles } from '@/shared/styles/settings/Reglages.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Connexion à Google Drive et synchronisation des données. */
export function CarteGoogleDrive({ drive }: { drive: ReturnType<typeof useGoogleDrive> }) {
  const { settings } = useAppSettings();
  const disponible = isSecureStoreAvailable();

  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{TEXTES.settings.reglages.googleDrive}</Text>
      <Text style={commonStyles.muted}>{TEXTES.settings.reglages.synchroniseLesFichiersTexteCheptel}</Text>

      {!disponible && (
        <Text style={styles.warning}>{TEXTES.settings.reglages.laSynchronisationGoogleDriveN}</Text>
      )}

      {disponible && !drive.connecte && (
        <Button
          label={TEXTES.settings.reglages.seConnecterAGoogleDrive}
          onPress={drive.seConnecter}
          loading={drive.connexionEnCours}
        />
      )}

      {disponible && drive.connecte && (
        <View style={commonStyles.gap10}>
          <Text style={commonStyles.line}>
            {TEXTES.settings.reglages.compteDeuxPoints}
            {settings.driveAccountEmail ?? '—'}
          </Text>
          <Text style={commonStyles.line}>
            {TEXTES.settings.reglages.dossierDeuxPoints}
            {settings.driveFolderName ?? TEXTES.settings.reglages.troupeauChevres}
          </Text>
          <Text style={commonStyles.muted}>
            {settings.derniereSynchronisation
              ? TEXTES.settings.reglages.derniereSynchronisationValeur(
                  new Date(settings.derniereSynchronisation).toLocaleString(LOCALE),
                )
              : TEXTES.settings.reglages.jamaisSynchronise}
          </Text>
          {drive.syncEnCours && (
            <Text style={commonStyles.muted}>
              {TEXTES.settings.reglages.enCoursPoints}
              {drive.syncEtape}
            </Text>
          )}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              label={TEXTES.settings.reglages.envoyerVersDrive}
              onPress={() => drive.synchroniser('push')}
              loading={drive.syncEnCours === 'push'}
              disabled={!!drive.syncEnCours}
            />
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.settings.reglages.recupererDepuisDrive}
              onPress={() => drive.synchroniser('pull')}
              loading={drive.syncEnCours === 'pull'}
              disabled={!!drive.syncEnCours}
            />
          </View>
          <Button
            label={TEXTES.settings.reglages.seDeconnecter}
            variant="danger"
            onPress={drive.seDeconnecter}
          />
        </View>
      )}
    </Card>
  );
}
