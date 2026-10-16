import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import {
  disconnectGoogle,
  emailGoogleCourant,
  getValidAccessToken,
  isGoogleConnected,
  signInWithGoogle,
} from '@/features/drive/googleAuth';
import {
  ensureRootFolder,
  nomDossierDrive,
  pousserToutesAnnees,
  tirerToutesAnnees,
} from '@/features/drive/sync';
import { noterSauvegarde } from '@/features/sauvegarde/derniereSauvegarde';
import { ID_ETABLISSEMENT_DEFAUT } from '@/shared/constants/stockage';
import { TEXTES } from '@/shared/textes';

/** Connexion à Google Drive et synchronisation (envoi / récupération) des données de l'établissement. */
export function useGoogleDrive() {
  const { settings, patchSettings } = useAppSettings();
  const { actif, recharger } = useEtablissement();

  const [connecte, setConnecte] = useState(false);
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [syncEnCours, setSyncEnCours] = useState<'push' | 'pull' | null>(null);
  const [syncEtape, setSyncEtape] = useState('');

  const charger = useCallback(async () => {
    setConnecte(await isGoogleConnected());
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const seConnecter = async () => {
    setConnexionEnCours(true);
    try {
      const resultat = await signInWithGoogle();
      if (!resultat) return; // annulé par l'utilisateur
      const nomDossier = nomDossierDrive(actif.nom, actif.id === ID_ETABLISSEMENT_DEFAUT);
      const folderId = await ensureRootFolder(resultat.accessToken, nomDossier);
      await patchSettings({
        driveAccountEmail: resultat.email,
        driveFolderId: folderId,
        driveFolderName: nomDossier,
      });
      setConnecte(true);
      Alert.alert(
        TEXTES.settings.reglages.connecte,
        TEXTES.settings.reglages.connecteAGoogleDriveEmail(resultat.email),
      );
    } catch (e: any) {
      Alert.alert(TEXTES.settings.reglages.erreurDeConnexion, e?.message ?? String(e));
    } finally {
      setConnexionEnCours(false);
    }
  };

  /**
   * La connexion à Google est celle de l'appareil, mais le dossier Drive est propre à chaque établissement : un
   * établissement créé après la connexion n'a ni compte ni dossier. On le relie au compte déjà connecté.
   */
  const lier = async () => {
    setConnexionEnCours(true);
    try {
      const accessToken = await getValidAccessToken();
      const email = await emailGoogleCourant();
      if (!accessToken || !email) {
        Alert.alert(
          TEXTES.settings.reglages.sessionExpiree,
          TEXTES.settings.reglages.merciDeVousReconnecterA,
        );
        setConnecte(false);
        return;
      }
      const nomDossier = nomDossierDrive(actif.nom, actif.id === ID_ETABLISSEMENT_DEFAUT);
      const folderId = await ensureRootFolder(accessToken, nomDossier);
      await patchSettings({
        driveAccountEmail: email,
        driveFolderId: folderId,
        driveFolderName: nomDossier,
      });
      Alert.alert(
        TEXTES.settings.reglages.connecte,
        TEXTES.settings.reglages.connecteAGoogleDriveEmail(email),
      );
    } catch (e: any) {
      Alert.alert(TEXTES.settings.reglages.erreurDeConnexion, e?.message ?? String(e));
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
        Alert.alert(
          TEXTES.settings.reglages.sessionExpiree,
          TEXTES.settings.reglages.merciDeVousReconnecterA,
        );
        setConnecte(false);
        return;
      }
      const onProgress = (annee: number, categorie: string) => setSyncEtape(`${categorie} ${annee}`);
      let bilan;
      if (sens === 'push') {
        bilan = await pousserToutesAnnees(accessToken, settings.driveFolderId, onProgress);
      } else {
        bilan = await tirerToutesAnnees(accessToken, settings.driveFolderId, onProgress);
        // Les espèces de l'établissement ont pu changer : on les relit pour afficher les bons cheptels.
        await recharger();
      }
      await patchSettings({ derniereSynchronisation: new Date().toISOString() });
      // Les données envoyées sur Drive sont sauvegardées (pas celles qu'on en récupère).
      if (sens === 'push') await noterSauvegarde();
      Alert.alert(
        TEXTES.settings.reglages.termine,
        `${
          sens === 'push'
            ? TEXTES.settings.reglages.donneesEnvoyeesVersGoogleDrive
            : TEXTES.settings.reglages.donneesRecupereesDepuisGoogleDrive
        } ${TEXTES.settings.reglages.bilanSynchro(bilan.misAJour, bilan.inchanges)}`,
      );
      charger();
    } catch (e: any) {
      Alert.alert(TEXTES.settings.reglages.erreurDeSynchronisation, e?.message ?? String(e));
    } finally {
      setSyncEnCours(null);
      setSyncEtape('');
    }
  };

  return {
    connecte,
    connexionEnCours,
    syncEnCours,
    syncEtape,
    seConnecter,
    lier,
    seDeconnecter,
    synchroniser,
  };
}
