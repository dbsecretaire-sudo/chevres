import AsyncStorage from '@react-native-async-storage/async-storage';
import { fusionnerModifications, modificationsDe, type Modification } from '@/shared/storage/fiches';

/** La file des modifications pas encore envoyées au serveur, sur cet appareil. */
export const CLE_ATTENTE = 'troupeau:v1:sync-attente';

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
    const file = fusionnerModifications([...(await lireAttente()), ...modifications]);
    await AsyncStorage.setItem(CLE_ATTENTE, JSON.stringify(file));
  });
}
