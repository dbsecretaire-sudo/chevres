import AsyncStorage from '@react-native-async-storage/async-storage';
import { construireSauvegardeComplete, restaurerSauvegarde, type ResultatImport } from '@/features/sauvegarde/backup';
import { getIdEtablissementActif } from '@/shared/storage/etablissementActif';

/** L'adresse de l'API de synchronisation, sur l'hébergement OVH. */
export const URL_SERVEUR_SYNC = 'https://chevres.pronta.corsica/api/index.php';

/** L'exploitation par défaut du serveur : celle des comptes créés avant les accès multiples, et celle de l'administrateur sans exploitation. */
const EXPLOITATION_PAR_DEFAUT = 'exploitation';

const CLE_CONNEXION = 'troupeau:v1:sync-connexion';
const CLE_VERSION = 'troupeau:v1:sync-version';

export interface Connexion {
  jeton: string;
  identifiant: string;
  /** Quand la connexion a été faite (en millisecondes), pour information. */
  obtenueLe?: number;
  /** Le rôle du compte, renvoyé par le serveur : « administrateur », « moderateur » ou « utilisateur ». Absent sur un serveur ancien (traité comme modérateur). */
  role?: string;
  /** Les exploitations ouvertes à ce compte (vide pour l'administrateur, qui les voit toutes). */
  exploitations?: string[];
  /** La première exploitation du compte, pour les anciennes versions du serveur. */
  etablissement?: string | null;
}

/** Le serveur a une version plus récente que celle de cet appareil : il faut recevoir avant d'envoyer. */
export class ConflitDeSynchronisation extends Error {
  constructor(readonly versionServeur: number) {
    super('Conflit de synchronisation');
  }
}

/** La connexion n'est plus valable (ou n'a jamais été faite) : il faut se reconnecter. */
export class ConnexionExpiree extends Error {}

export async function lireConnexion(): Promise<Connexion | null> {
  const brut = await AsyncStorage.getItem(CLE_CONNEXION);
  if (!brut) return null;
  // La connexion reste valable jusqu'à la déconnexion (ou jusqu'à ce que le serveur la refuse) : le code d'accès protège l'ouverture de l'application.
  return JSON.parse(brut) as Connexion;
}

/**
 * L'exploitation que cet appareil synchronise : la première du compte connecté. Un compte sans exploitation (l'administrateur) et
 * un appareil non connecté utilisent l'exploitation par défaut.
 */
export async function exploitationDeLaConnexion(): Promise<string> {
  // L'établissement actif est l'exploitation synchronisée : pour un modérateur ou un utilisateur, c'est la seule qu'il a.
  return getIdEtablissementActif() || EXPLOITATION_PAR_DEFAUT;
}

/** Appelle une action de l'API et rend le code HTTP avec la réponse en JSON. */
export async function appeler(
  action: string,
  methode: 'GET' | 'POST' | 'PUT',
  { corps, parametres = '', jeton, signal }: { corps?: unknown; parametres?: string; jeton?: string; signal?: AbortSignal } = {},
): Promise<{ statut: number; json: any }> {
  const reponse = await fetch(`${URL_SERVEUR_SYNC}?r=${action}${parametres}`, {
    method: methode,
    headers: {
      'Content-Type': 'application/json',
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
    },
    body: corps === undefined ? undefined : JSON.stringify(corps),
    signal,
  });
  const json = await reponse.json().catch(() => ({}));
  return { statut: reponse.status, json };
}

export async function jetonDeConnexion(): Promise<string> {
  const connexion = await lireConnexion();
  if (!connexion) throw new ConnexionExpiree('Connecte-toi d’abord.');
  return connexion.jeton;
}

/** Connecte cet appareil : son jeton est gardé, le mot de passe ne l'est pas. */
export async function seConnecter(identifiant: string, motDePasse: string): Promise<void> {
  const { statut, json } = await appeler('connexion', 'POST', {
    corps: { identifiant, mot_de_passe: motDePasse },
  });
  if (statut !== 200) throw new Error(json.erreur ?? 'Connexion impossible.');
  const connexion: Connexion = {
    jeton: json.jeton,
    identifiant: json.identifiant,
    obtenueLe: Date.now(),
    role: json.role,
    exploitations: Array.isArray(json.exploitations) ? json.exploitations : [],
    etablissement: json.etablissement ?? null,
  };
  await AsyncStorage.setItem(CLE_CONNEXION, JSON.stringify(connexion));
}

/** Ce qui doit savoir qu'on s'est déconnecté (l'accès au compte de la ferme se referme). */
const ecouteursDeconnexion = new Set<() => void>();

/** Prévient à la déconnexion. Rend la fonction qui arrête l'écoute. */
export function surDeconnexion(ecouteur: () => void): () => void {
  ecouteursDeconnexion.add(ecouteur);
  return () => ecouteursDeconnexion.delete(ecouteur);
}

/** Oublie la connexion et la version connue de cet appareil. */
export async function seDeconnecter(): Promise<void> {
  // Le serveur supprime la session : le jeton ne sert plus, même s'il a été copié. Hors ligne, on efface quand même ici ; la session expire alors seule au bout de 30 jours.
  try {
    const connexion = await lireConnexion();
    if (connexion) await appeler('deconnexion', 'POST', { jeton: connexion.jeton });
  } catch {
    // Pas de réseau : rien à faire de plus.
  }
  await AsyncStorage.removeItem(CLE_CONNEXION);
  await AsyncStorage.removeItem(CLE_VERSION);
  ecouteursDeconnexion.forEach((ecouteur) => ecouteur());
}

/**
 * Envoie la sauvegarde complète au serveur. Le serveur refuse (conflit) si quelqu'un a envoyé une version plus récente
 * depuis la dernière réception de cet appareil.
 */
export async function envoyerSauvegarde(): Promise<number> {
  const jeton = await jetonDeConnexion();
  const versionConnue = Number((await AsyncStorage.getItem(CLE_VERSION)) ?? 0);
  const donnees = await construireSauvegardeComplete();
  const { statut, json } = await appeler('ecrire', 'PUT', {
    jeton,
    corps: { etablissement: await exploitationDeLaConnexion(), version_attendue: versionConnue, donnees },
  });
  if (statut === 409) throw new ConflitDeSynchronisation(Number(json.version));
  if (statut === 401) throw new ConnexionExpiree(json.erreur);
  if (statut !== 200) throw new Error(json.erreur ?? 'Envoi impossible.');
  await AsyncStorage.setItem(CLE_VERSION, String(json.version));
  return Number(json.version);
}

/**
 * Attend une modification de l'exploitation après le numéro « depuis » (voir l'action attendre du serveur). Rend « changement » vrai dès qu'il y
 * en a une, ou faux après une vingtaine de secondes sans rien. Une connexion expirée lève ConnexionExpiree.
 */
export async function attendreChangement(depuis: number, signal?: AbortSignal): Promise<{ changement: boolean; curseur: number }> {
  const jeton = await jetonDeConnexion();
  const { statut, json } = await appeler('attendre', 'GET', {
    jeton,
    parametres: `&etablissement=${await exploitationDeLaConnexion()}&depuis=${depuis}`,
    signal,
  });
  if (statut === 401) throw new ConnexionExpiree(json.erreur);
  if (statut !== 200) throw new Error(json.erreur ?? 'Attente impossible.');
  return { changement: json.changement === true, curseur: Number(json.curseur) };
}

/** Reçoit la sauvegarde du serveur et la restaure sur cet appareil : elle remplace les données actuelles. */
export async function recevoirSauvegarde(): Promise<ResultatImport> {
  const jeton = await jetonDeConnexion();
  const { statut, json } = await appeler('lire', 'GET', {
    jeton,
    parametres: `&etablissement=${await exploitationDeLaConnexion()}`,
  });
  if (statut === 401) throw new ConnexionExpiree(json.erreur);
  if (statut !== 200) throw new Error(json.erreur ?? 'Réception impossible.');
  if (!json.donnees) throw new Error('Il n’y a pas encore de sauvegarde sur le serveur.');
  const resultat = await restaurerSauvegarde(json.donnees);
  await AsyncStorage.setItem(CLE_VERSION, String(json.version));
  return resultat;
}
