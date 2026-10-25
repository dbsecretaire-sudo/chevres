import AsyncStorage from '@react-native-async-storage/async-storage';
import { PREFIXE_STOCKAGE, SEPARATEUR_CLE } from '@/shared/constants/stockage';
import { fusionnerModifications, modificationsDe, type Modification } from '@/shared/storage/fiches';

/** La file des modifications pas encore envoyées au serveur, sur cet appareil. */
export const CLE_ATTENTE = 'troupeau:v1:sync-attente';

/** Le numéro du dernier changement reçu du serveur : on ne redemande que ce qui vient après. Absent tant que la première synchronisation n'a pas eu lieu. */
export const CLE_CURSEUR = 'troupeau:v1:sync-curseur';

/** Les segments des clés qui restent propres à l'appareil : les années et les index (ils se reconstruisent), les réglages, les dates de sauvegarde, l'établissement actif. */
const SEGMENTS_LOCAUX = ['index', 'years', 'settings', 'derniere-sauvegarde', 'etablissement-actif'];

/** Les clés propres à l'appareil : jamais envoyées au serveur. */
export function estSynchronisable(cle: string): boolean {
  if (!cle.startsWith(PREFIXE_STOCKAGE)) return false;
  if (cle.startsWith(`${PREFIXE_STOCKAGE}sync-`)) return false;
  const localesParNom = ['a-envoyer', 'visite-guidee', 'rappel-du-jour'];
  if (localesParNom.some((nom) => cle.startsWith(`${PREFIXE_STOCKAGE}${nom}`))) return false;
  return !cle.split(SEPARATEUR_CLE).some((segment) => SEGMENTS_LOCAUX.includes(segment));
}

/**
 * Les écritures se font une à une : deux écritures en même temps (des upserts concurrents, sur des zones différentes) lisent et réécrivent la même
 * file d'attente, et sans cet ordre l'une des deux modifications serait perdue.
 */
let verrou: Promise<unknown> = Promise.resolve();

function enSerie<T>(travail: () => Promise<T>): Promise<T> {
  const suite = verrou.then(travail, travail);
  verrou = suite.catch(() => undefined);
  return suite;
}

async function lireJson<T>(cle: string): Promise<T | undefined> {
  const brut = await AsyncStorage.getItem(cle);
  if (brut === null) return undefined;
  try {
    return JSON.parse(brut) as T;
  } catch {
    return undefined;
  }
}

/** Les modifications qui attendent d'être envoyées, une par fiche. */
export async function lireAttente(): Promise<Modification[]> {
  return (await lireJson<Modification[]>(CLE_ATTENTE)) ?? [];
}

/** Les écouteurs de la file sont prévenus de son nombre à chaque écriture (la synchronisation automatique et les compteurs les suivent). */
const ecouteursAttente = new Set<(nombre: number) => void>();

/** Suit le nombre de modifications en attente. Rend la fonction qui se désabonne. */
export function surAttente(ecouteur: (nombre: number) => void): () => void {
  ecouteursAttente.add(ecouteur);
  return () => ecouteursAttente.delete(ecouteur);
}

/** Écrit la file, sans verrou : à n'appeler que depuis une écriture déjà en série. */
async function ecrireAttenteSansVerrou(file: Modification[]): Promise<void> {
  await AsyncStorage.setItem(CLE_ATTENTE, JSON.stringify(file));
  for (const ecouteur of [...ecouteursAttente]) ecouteur(file.length);
}

/** La valeur gardée sur cet appareil pour une clé (undefined s'il n'y en a pas). */
export function lireValeurLocale(cle: string): Promise<unknown> {
  return lireJson<unknown>(cle);
}

/**
 * Écrit une donnée qui se synchronise : elle est gardée sur l'appareil, et chaque fiche qui a changé rejoint la file d'attente.
 * Une valeur inchangée n'ajoute rien à la file.
 */
export function ecrireDonnee(cle: string, valeur: unknown): Promise<void> {
  return enSerie(async () => {
    const avant = await lireJson<unknown>(cle);
    if (valeur === undefined) await AsyncStorage.removeItem(cle);
    else await AsyncStorage.setItem(cle, JSON.stringify(valeur));

    const modifications = modificationsDe(cle, avant, valeur);
    if (modifications.length === 0) return;
    await ecrireAttenteSansVerrou(fusionnerModifications([...(await lireAttente()), ...modifications]));
  });
}

/**
 * Écrit une donnée reçue du serveur : la copie locale change, mais rien ne repart vers le serveur (le changement vient de lui).
 */
export function ecrireDonneeRecue(cle: string, valeur: unknown): Promise<void> {
  return enSerie(async () => {
    if (valeur === undefined) await AsyncStorage.removeItem(cle);
    else await AsyncStorage.setItem(cle, JSON.stringify(valeur));
  });
}

/** Ajoute des modifications à la file (la première synchronisation y met tout ce que l'appareil a déjà). */
export function ajouterAttente(modifications: Modification[]): Promise<void> {
  return enSerie(async () => {
    if (modifications.length === 0) return;
    await ecrireAttenteSansVerrou(fusionnerModifications([...(await lireAttente()), ...modifications]));
  });
}

/**
 * Retire de la file les modifications envoyées. Une fiche refaite entre-temps (contenu différent) reste dans la file pour le prochain envoi.
 * Rend le nombre de modifications retirées.
 */
export function retirerDeAttente(envoyees: Modification[]): Promise<number> {
  return enSerie(async () => {
    const avant = await lireAttente();
    const restantes = avant.filter(
      (restante) =>
        !envoyees.some(
          (envoyee) =>
            envoyee.zone === restante.zone &&
            envoyee.identifiant === restante.identifiant &&
            JSON.stringify(envoyee.contenu) === JSON.stringify(restante.contenu),
        ),
    );
    await ecrireAttenteSansVerrou(restantes);
    return avant.length - restantes.length;
  });
}

/** Une modification est-elle encore dans la file (pas encore envoyée) ? */
export function fichesEnAttente(file: Modification[]): Set<string> {
  return new Set(file.map((m) => `${m.zone}\u0000${m.identifiant}`));
}

/** Le numéro du dernier changement reçu, ou undefined si la première synchronisation n'a pas encore eu lieu. */
export async function lireCurseur(): Promise<number | undefined> {
  const brut = await AsyncStorage.getItem(CLE_CURSEUR);
  if (brut === null) return undefined;
  const numero = Number(brut);
  return Number.isInteger(numero) && numero >= 0 ? numero : undefined;
}

export async function ecrireCurseur(numero: number): Promise<void> {
  await AsyncStorage.setItem(CLE_CURSEUR, String(numero));
}

/** Les écouteurs sont prévenus après la réception d'une zone : la couche de stockage y reconstruit ses index. */
type EcouteurReception = (zone: string) => void | Promise<void>;
const ecouteursReception = new Set<EcouteurReception>();

/** Suit les zones qui viennent d'être reçues du serveur. Rend la fonction qui se désabonne. */
export function surReception(ecouteur: EcouteurReception): () => void {
  ecouteursReception.add(ecouteur);
  return () => ecouteursReception.delete(ecouteur);
}

/** Prévient les écouteurs d'une zone reçue. Un écouteur en défaut ne bloque pas les autres. */
export async function prevenirReception(zone: string): Promise<void> {
  for (const ecouteur of [...ecouteursReception]) {
    try {
      await ecouteur(zone);
    } catch {
      // Une réception doit réussir même si un écouteur échoue.
    }
  }
}
