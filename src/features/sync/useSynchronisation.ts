import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { noterSauvegarde } from '@/features/sauvegarde/derniereSauvegarde';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import {
  ConnexionExpiree,
  lireConnexion,
  seConnecter,
  seDeconnecter,
  type Connexion,
} from '@/features/sync/synchronisation';
import { premiereSynchronisation, recevoirChangements, synchroniser } from '@/features/sync/moteur';
import { lireAttente, lireCurseur } from '@/shared/storage/depot';
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

  /** Une connexion expirée se explique ; les autres erreurs sont montrées telles quelles. */
  const signaler = (erreur: unknown) => {
    if (erreur instanceof ConnexionExpiree) {
      setConnexion(null);
      Alert.alert(T.connexionExpiree, T.reconnecteToi);
      return;
    }
    Alert.alert(T.erreurTitre, erreur instanceof Error ? erreur.message : String(erreur));
  };

  /** Le nombre de modifications qui attendent d'être envoyées (affiché sous les boutons). */
  const [enAttente, setEnAttente] = useState(0);
  const actualiserEnAttente = async () => {
    setEnAttente((await lireAttente()).length);
  };
  useEffect(() => {
    lireAttente().then((file) => setEnAttente(file.length)).catch(() => setEnAttente(0));
  }, []);

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

  /** Après une synchronisation : les données reçues s'affichent, et ce qui était en attente est parti. */
  const finirSynchronisation = async () => {
    await recharger();
    await refreshSettings();
    await noterSauvegarde();
    await patchSettings({ derniereSynchronisation: new Date().toISOString() });
    await actualiserEnAttente();
  };

  /** Envoie ce qui attend, puis reçoit ce que les autres ont envoyé. */
  const envoyer = async () => {
    setOccupe('envoi');
    try {
      const bilan = await synchroniser();
      await remettreAEnvoyer();
      await finirSynchronisation();
      if (bilan.refusees > 0) Alert.alert(T.erreurTitre, T.refusees(bilan.refusees));
      else Alert.alert(T.envoyee, T.envoyeeTexte);
    } catch (erreur) {
      signaler(erreur);
      await actualiserEnAttente().catch(() => undefined);
    } finally {
      setOccupe(null);
    }
  };

  /** Reçoit seulement ce que les autres ont envoyé (ce qui attend sur cet appareil ne bouge pas). */
  const recevoir = async () => {
    setOccupe('reception');
    try {
      // La toute première fois, la première synchronisation complète se fait (elle envoie aussi ce que cet appareil a déjà).
      if ((await lireCurseur()) === undefined) await premiereSynchronisation();
      else await recevoirChangements();
      await finirSynchronisation();
      Alert.alert(T.recue, T.recueTexte);
    } catch (erreur) {
      signaler(erreur);
    } finally {
      setOccupe(null);
    }
  };

  return { connexion, occupe, enAttente, seConnecterAvec, deconnecter, envoyer, recevoir };
}
