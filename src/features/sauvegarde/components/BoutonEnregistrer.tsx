import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { exporterSauvegardeLocale } from '@/features/sauvegarde/backup';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useGoogleDrive } from '@/features/settings/hooks/useGoogleDrive';
import { BoutonPlat } from '@/shared/components/BoutonPlat';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { useEchelle } from '@/shared/theme/miseEnPage';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.sauvegarde.enregistrer;

/**
 * La disquette de la capsule du haut : « Enregistrer » propose Google Drive (les données y partent d'un appui quand le compte est connecté ; sinon l'écran de
 * connexion s'ouvre) ou un fichier sur l'appareil (la sauvegarde complète, à garder hors de l'appareil).
 */
export function BoutonEnregistrer({ plat = false }: { plat?: boolean }) {
  const router = useRouter();
  const echelle = useEchelle();
  const drive = useGoogleDrive();
  const { settings } = useAppSettings();
  const [menu, setMenu] = useState(false);
  const [fichierEnCours, setFichierEnCours] = useState(false);

  const surDrive = () => {
    // Pas encore connecté (ou pas de dossier Drive pour cet établissement) : l'écran de Google Drive, où l'on se connecte.
    if (!drive.connecte || !settings.driveFolderId) return router.push(ROUTES.GOOGLE_DRIVE as never);
    drive.synchroniser('push').catch(() => undefined);
  };
  const surAppareil = async () => {
    setFichierEnCours(true);
    try {
      await exporterSauvegardeLocale();
    } catch (e: unknown) {
      Alert.alert(TEXTES.settings.reglages.erreurDeSauvegarde, e instanceof Error ? e.message : String(e));
    } finally {
      setFichierEnCours(false);
    }
  };
  const occupe = fichierEnCours || drive.syncEnCours !== null;

  return (
    <>
      {plat ? (
        <BoutonPlat icone="save-outline" libelle={T.bouton} onPress={() => setMenu(true)} disabled={occupe} />
      ) : (
      <Pressable
        style={({ pressed }) => [
          styles.pastille,
          { paddingVertical: Math.round(9 * echelle) },
          pressed && styles.appuyee,
        ]}
        onPress={() => setMenu(true)}
        disabled={occupe}
        accessibilityRole="button"
        accessibilityLabel={T.bouton}
      >
        {occupe ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Ionicons name="save" size={Math.round(20 * echelle)} color={colors.primary} />
        )}
      </Pressable>
      )}
      <OptionsModal
        visible={menu}
        onClose={() => setMenu(false)}
        title={T.titre}
        options={[
          { label: T.surDrive, icon: 'cloud-upload', onPress: surDrive },
          { label: T.surAppareil, icon: 'download', onPress: surAppareil },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Une pastille blanche à l'icône seule : elle ne prend que sa place, les pastilles à mot se partagent le reste.
  pastille: {
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  appuyee: { opacity: 0.8 },
});
