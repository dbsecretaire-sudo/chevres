import { useCallback, useEffect, useState } from 'react';
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
  driveADesDonneesEnPlusPartout,
  fusionnerAvecDrive,
  pourChaqueEtablissement,
  sommeDesBilans,
  nomDossierDrive,
  pousserToutesAnnees,
  tirerToutesAnnees,
} from '@/features/drive/sync';
import { noterSauvegarde } from '@/features/sauvegarde/derniereSauvegarde';
import { ID_ETABLISSEMENT_DEFAUT } from '@/shared/constants/stockage';
import { TEXTES } from '@/shared/textes';

/**
 * Connexion à Google Drive et synchronisation (envoi / récupération) des données de l'établissement, sans rien demander à la navigation :
 * l'écran du mode normal, qui n'a pas de pile d'écrans, s'en sert directement.
 */
export function useGoogleDriveSansNavigation() {
  const { settings, patchSettings, refreshSettings } = useAppSettings();
  const { actif, recharger } = useEtablissement();

  const [connecte, setConnecte] = useState(false);
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [syncEnCours, setSyncEnCours] = useState<'push' | 'pull' | 'merge' | null>(null);
  const [syncEtape, setSyncEtape] = useState('');

  const charger = useCallback(async () => {
    setConnecte(await isGoogleConnected());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, [charger]);

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

  const synchroniser = async (sens: 'push' | 'pull' | 'merge') => {
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
      // Envoyer sur Drive : si Drive a des données que cet appareil n'a pas, on propose de les fusionner d'abord (sinon elles seraient écrasées).
      if (sens === 'push' && (await driveADesDonneesEnPlusPartout(accessToken))) {
        const fusionner = await new Promise<boolean>((resolve) =>
          Alert.alert(
            TEXTES.settings.reglages.fusionDemandeTitre,
            TEXTES.settings.reglages.fusionDemande,
            [
              { text: TEXTES.commun.general.annuler, style: 'cancel', onPress: () => resolve(false) },
              { text: TEXTES.settings.reglages.fusionOui, onPress: () => resolve(true) },
            ],
            { onDismiss: () => resolve(false) },
          ),
        );
        if (!fusionner) return;
        sens = 'merge';
        setSyncEnCours('merge');
      }
      const onProgress = (annee: number, categorie: string) => setSyncEtape(`${categorie} ${annee}`);
      let bilan;
      if (sens === 'merge') {
        // Deux appareils ont travaillé chacun de leur côté : tout est réuni, puis renvoyé sur Drive.
        // Chaque établissement a son dossier sur Drive : ils sont tous fusionnés (ceux qui ne sont que sur Drive sont créés ici).
        const fusions = await pourChaqueEtablissement(
          accessToken,
          (folderId, etablissement) =>
            fusionnerAvecDrive(accessToken, folderId, (etape) => setSyncEtape(`${etablissement.nom} · ${etape}`)),
          true,
        );
        const fusion = {
          ajoutes: fusions.reduce((t, f) => t + f.ajoutes, 0),
          conflits: fusions.reduce((t, f) => t + f.conflits, 0),
        };
        await recharger();
        await refreshSettings();
        await patchSettings({ derniereSynchronisation: new Date().toISOString() });
        await noterSauvegarde();
        Alert.alert(TEXTES.settings.reglages.termine, TEXTES.settings.reglages.fusionTerminee(fusion.ajoutes, fusion.conflits));
        charger();
        return;
      }
      if (sens === 'push') {
        bilan = sommeDesBilans(
          await pourChaqueEtablissement(accessToken, (folderId) => pousserToutesAnnees(accessToken, folderId, onProgress)),
        );
      } else {
        // Les établissements créés depuis un autre appareil (leur dossier est sur Drive) sont créés ici, puis chacun est récupéré.
        bilan = sommeDesBilans(
          await pourChaqueEtablissement(accessToken, (folderId) => tirerToutesAnnees(accessToken, folderId, onProgress), true),
        );
        // Les espèces de l'établissement ont pu changer : on les relit pour afficher les bons cheptels.
        await recharger();
        // Les réglages récupérés (les dates d'estive, les lots…) changent l'accueil : on les relit tout de suite.
        await refreshSettings();
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
    charger,
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

/** Comme ci-dessus, et la connexion est relue à chaque fois que l'écran reprend le focus (après une connexion faite ailleurs). */
export function useGoogleDrive() {
  const drive = useGoogleDriveSansNavigation();
  const { charger } = drive;
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );
  return drive;
}
