import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { noterSauvegarde } from '@/features/sauvegarde/derniereSauvegarde';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import {
  ConflitDeSynchronisation,
  ConnexionExpiree,
  envoyerSauvegarde,
  lireConnexion,
  recevoirSauvegarde,
  seConnecter,
  seDeconnecter,
  type Connexion,
} from '@/features/sync/synchronisation';
import { remettreAEnvoyer } from '@/shared/storage/aEnvoyer';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.synchronisation;

/** Ce que fait la synchronisation en ce moment, pour désactiver les boutons pendant ce temps. */
export type Occupation = 'connexion' | 'envoi' | 'reception' | null;

/** La synchronisation avec le serveur de la ferme : connexion, envoi et réception, avec les messages d'erreur. */
export function useSynchronisation() {
  const { patchSettings, refreshSettings } = useAppSettings();
  const { recharger } = useEtablissement();
  const [connexion, setConnexion] = useState<Connexion | null>(null);
  const [occupe, setOccupe] = useState<Occupation>(null);

  useEffect(() => {
    lireConnexion().then(setConnexion).catch(() => setConnexion(null));
  }, []);

  /** Une connexion expirée ou un conflit se explique ; les autres erreurs sont montrées telles quelles. */
  const signaler = (erreur: unknown) => {
    if (erreur instanceof ConnexionExpiree) {
      setConnexion(null);
      Alert.alert(T.connexionExpiree, T.reconnecteToi);
      return;
    }
    if (erreur instanceof ConflitDeSynchronisation) {
      Alert.alert(T.conflitTitre, T.conflitTexte);
      return;
    }
    Alert.alert(T.erreurTitre, erreur instanceof Error ? erreur.message : String(erreur));
  };

  const seConnecterAvec = async (identifiant: string, motDePasse: string) => {
    setOccupe('connexion');
    try {
      await seConnecter(identifiant, motDePasse);
      setConnexion(await lireConnexion());
    } catch (erreur) {
      signaler(erreur);
    } finally {
      setOccupe(null);
    }
  };

  const deconnecter = async () => {
    await seDeconnecter();
    setConnexion(null);
  };

  const envoyer = async () => {
    setOccupe('envoi');
    try {
      await envoyerSauvegarde();
      await remettreAEnvoyer();
      await noterSauvegarde();
      await patchSettings({ derniereSynchronisation: new Date().toISOString() });
      Alert.alert(T.envoyee, T.envoyeeTexte);
    } catch (erreur) {
      signaler(erreur);
    } finally {
      setOccupe(null);
    }
  };

  const recevoir = async () => {
    setOccupe('reception');
    try {
      await recevoirSauvegarde();
      await recharger();
      await refreshSettings();
      await noterSauvegarde();
      await patchSettings({ derniereSynchronisation: new Date().toISOString() });
      Alert.alert(T.recue, T.recueTexte);
    } catch (erreur) {
      signaler(erreur);
    } finally {
      setOccupe(null);
    }
  };

  return { connexion, occupe, seConnecterAvec, deconnecter, envoyer, recevoir };
}
