import AsyncStorage from '@react-native-async-storage/async-storage';
import { appeler, ConnexionExpiree, jetonDeConnexion } from '@/features/sync/synchronisation';
import {
  ajouterAttente,
  ecrireCurseur,
  ecrireDonneeRecue,
  estSynchronisable,
  fichesEnAttente,
  lireAttente,
  lireCurseur,
  lireValeurLocale,
  prevenirReception,
  retirerDeAttente,
} from '@/shared/storage/depot';
import { appliquerModification, modificationsDe, type Modification } from '@/shared/storage/fiches';

/** L'exploitation sur le serveur : une seule, pour tous les appareils. */
export const EXPLOITATION_SYNC = 'exploitation';

/** Nombre maximal de modifications par envoi (le serveur refuse au-delà). */
export const TAILLE_LOT = 200;

/** Une seule synchronisation à la fois : sinon deux envois pourraient partir ensemble. */
let enCours: Promise<unknown> | null = null;

function enExclusivite<T>(travail: () => Promise<T>): Promise<T> {
  const suite = (enCours ?? Promise.resolve()).then(travail, travail);
  enCours = suite.catch(() => undefined);
  return suite;
}

/**
 * Envoie au serveur, par lots, tout ce qui attend dans la file. Une erreur arrête l'envoi : ce qui reste part à la prochaine fois.
 * Rend le nombre de modifications envoyées.
 */
export function envoyerAttente(): Promise<number> {
  return enExclusivite(async () => {
    const jeton = await jetonDeConnexion();
    let envoyees = 0;
    for (;;) {
      const file = await lireAttente();
      if (file.length === 0) return envoyees;
      const lot: Modification[] = file.slice(0, TAILLE_LOT);
      const { statut, json } = await appeler('pousser', 'POST', {
        jeton,
        corps: { etablissement: EXPLOITATION_SYNC, modifications: lot },
      });
      if (statut === 401) throw new ConnexionExpiree(json.erreur);
      if (statut !== 200) throw new Error(json.erreur ?? 'Envoi impossible.');
      const retirees = await retirerDeAttente(lot);
      // Si rien n'a pu être retiré, on s'arrête au lieu de renvoyer indéfiniment le même lot.
      if (retirees === 0) throw new Error('La file d’attente ne se vide pas : envoi interrompu.');
      envoyees += retirees;
    }
  });
}

/**
 * Reçoit du serveur ce qui a changé depuis la dernière réception. Une fiche qui a une modification pas encore envoyée sur cet appareil est gardée
 * telle quelle : cette modification partira au prochain envoi. Rend le nombre de modifications reçues.
 */
export function recevoirChangements(): Promise<number> {
  return enExclusivite(async () => {
    const jeton = await jetonDeConnexion();
    let recues = 0;
    for (;;) {
      const depuis = (await lireCurseur()) ?? 0;
      const { statut, json } = await appeler('tirer', 'GET', {
        jeton,
        parametres: `&etablissement=${EXPLOITATION_SYNC}&depuis=${depuis}`,
      });
      if (statut === 401) throw new ConnexionExpiree(json.erreur);
      if (statut !== 200) throw new Error(json.erreur ?? 'Réception impossible.');

      const enAttente = fichesEnAttente(await lireAttente());
      const zonesModifiees = new Set<string>();
      for (const modification of json.modifications as Modification[]) {
        recues++;
        if (!estSynchronisable(modification.zone)) continue;
        if (enAttente.has(`${modification.zone}\u0000${modification.identifiant}`)) continue;
        const locale = await lireValeurLocale(modification.zone);
        const nouvelle = appliquerModification(locale, modification);
        if (JSON.stringify(nouvelle) === JSON.stringify(locale)) continue;
        await ecrireDonneeRecue(modification.zone, nouvelle);
        zonesModifiees.add(modification.zone);
      }
      for (const zone of zonesModifiees) await prevenirReception(zone);

      await ecrireCurseur(Number(json.curseur));
      if (!json.encore) return recues;
    }
  });
}

/**
 * La toute première synchronisation de cet appareil. Tout ce qu'il contient part : la file reçoit d'abord toutes ses données. Puis la réception
 * garde ses propres données là où elles sont en attente, et ajoute ce qu'il ne connaît pas. Enfin tout part.
 * Les autres appareils ne sont donc jamais écrasés par une donnée qu'ils ont déjà envoyée, sauf quand cet appareil a une modification plus récente.
 */
export async function premiereSynchronisation(): Promise<void> {
  if ((await lireCurseur()) !== undefined) return;
  const cles = (await AsyncStorage.getAllKeys()).filter(estSynchronisable);
  for (const cle of cles) {
    const valeur = await lireValeurLocale(cle);
    if (valeur !== undefined) await ajouterAttente(modificationsDe(cle, undefined, valeur));
  }
  await recevoirChangements();
  await envoyerAttente();
}

/** Une synchronisation complète : ce que cet appareil a envoyé, puis ce que les autres ont envoyé. */
export async function synchroniser(): Promise<void> {
  if ((await lireCurseur()) === undefined) return premiereSynchronisation();
  await envoyerAttente();
  await recevoirChangements();
}
