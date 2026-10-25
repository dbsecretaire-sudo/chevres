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
import { piecesDe } from '@/features/fichiers/services/piecesFile';
import { envoyerPiecesEnAttente, mettreEnFileLesPiecesAnciennes, recevoirPiecesManquantes } from '@/features/fichiers/services/piecesSynchro';
import type { PieceJointe } from '@/features/fichiers/types';

/** L'exploitation sur le serveur : une seule, pour tous les appareils. */
export const EXPLOITATION_SYNC = 'exploitation';

/** Nombre maximal de modifications par envoi (le serveur refuse au-delà). */
export const TAILLE_LOT = 200;

/** Taille maximale d'un envoi, en caractères : au-dessus, le serveur refuse la requête entière. */
export const TAILLE_MAX_ENVOI = 3500000;

/** Une fiche plus lourde que cette taille ne part jamais : elle reste sur l'appareil. Elle doit tenir dans un envoi. */
export const TAILLE_MAX_FICHE_ENVOI = 3000000;

/** Une seule synchronisation à la fois : sinon deux envois pourraient partir ensemble. */
let enCours: Promise<unknown> | null = null;

function enExclusivite<T>(travail: () => Promise<T>): Promise<T> {
  const suite = (enCours ?? Promise.resolve()).then(travail, travail);
  enCours = suite.catch(() => undefined);
  return suite;
}

const cleFiche = (modification: { zone: string; identifiant: string }) => `${modification.zone}\u0000${modification.identifiant}`;

/** Le lot de la file à envoyer : au plus TAILLE_LOT fiches, sans dépasser TAILLE_MAX_ENVOI. Les fiches trop lourdes sont mises à part. */
function constituerLot(file: Modification[]): { lot: Modification[]; tropLourdes: Modification[] } {
  const lot: Modification[] = [];
  const tropLourdes: Modification[] = [];
  let taille = 0;
  for (const modification of file) {
    const longueur = JSON.stringify(modification.contenu ?? null).length;
    if (longueur > TAILLE_MAX_FICHE_ENVOI) {
      tropLourdes.push(modification);
      continue;
    }
    if (lot.length >= TAILLE_LOT || taille + longueur > TAILLE_MAX_ENVOI) break;
    lot.push(modification);
    taille += longueur;
  }
  return { lot, tropLourdes };
}

/** Le bilan d'un envoi : combien de modifications sont parties, et combien sont restées sur l'appareil faute d'être acceptées. */
export interface BilanEnvoi {
  envoyees: number;
  refusees: number;
}

/**
 * Envoie au serveur, par lots, tout ce qui attend dans la file. Une fiche que le serveur refuse (trop lourde, mal formée) reste sur l'appareil
 * et n'empêche pas les autres de partir. Une erreur de connexion ou de réseau arrête l'envoi : ce qui reste part à la prochaine fois.
 */
export function envoyerAttente(): Promise<BilanEnvoi> {
  return enExclusivite(async () => {
    const jeton = await jetonDeConnexion();
    let envoyees = 0;
    const refusees = new Set<string>();
    for (;;) {
      const file = (await lireAttente()).filter((modification) => !refusees.has(cleFiche(modification)));
      if (file.length === 0) return { envoyees, refusees: refusees.size };

      const { lot, tropLourdes } = constituerLot(file);
      tropLourdes.forEach((modification) => refusees.add(cleFiche(modification)));
      if (lot.length === 0) continue;

      const { statut, json } = await appeler('pousser', 'POST', {
        jeton,
        corps: { etablissement: EXPLOITATION_SYNC, modifications: lot },
      });
      if (statut === 401) throw new ConnexionExpiree(json.erreur);
      if (statut !== 200) throw new Error(json.erreur ?? 'Envoi impossible.');

      const refusesServeur = new Set<string>((json.refusees ?? []).map((r: { zone: string; identifiant: string }) => cleFiche(r)));
      refusesServeur.forEach((cle) => refusees.add(cle));
      const acceptees = lot.filter((modification) => !refusesServeur.has(cleFiche(modification)));
      // Rien d'accepté ni refusé : la réponse ne dit rien d'utile, on s'arrête au lieu de tourner en rond.
      if (acceptees.length === 0 && refusesServeur.size === 0) throw new Error('Réponse du serveur incomplète : envoi interrompu.');

      envoyees += await retirerDeAttente(acceptees);
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
    // Les fichiers joints citées par les fiches reçues : téléchargés une fois la réception finie.
    const piecesRecues: PieceJointe[] = [];
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
        piecesRecues.push(...piecesDe(modification.contenu));
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
      if (!json.encore) {
        await recevoirPiecesManquantes(EXPLOITATION_SYNC, piecesRecues);
        return recues;
      }
    }
  });
}

/**
 * La toute première synchronisation de cet appareil. Tout ce qu'il contient part : la file reçoit d'abord toutes ses données. Puis la réception
 * garde ses propres données là où elles sont en attente, et ajoute ce qu'il ne connaît pas. Enfin tout part.
 * Les autres appareils ne sont donc jamais écrasés par une donnée qu'ils ont déjà envoyée, sauf quand cet appareil a une modification plus récente.
 */
export async function premiereSynchronisation(): Promise<BilanEnvoi> {
  if ((await lireCurseur()) !== undefined) return { envoyees: 0, refusees: 0 };
  const cles = (await AsyncStorage.getAllKeys()).filter(estSynchronisable);
  for (const cle of cles) {
    const valeur = await lireValeurLocale(cle);
    if (valeur !== undefined) await ajouterAttente(modificationsDe(cle, undefined, valeur));
  }
  await recevoirChangements();
  return envoyerAttente();
}

/** Une synchronisation complète : ce que cet appareil a envoyé, puis ce que les autres ont envoyé. */
export async function synchroniser(): Promise<BilanEnvoi> {
  await mettreEnFileLesPiecesAnciennes();
  if ((await lireCurseur()) === undefined) {
    const bilan = await premiereSynchronisation();
    await envoyerPiecesEnAttente(EXPLOITATION_SYNC);
    return bilan;
  }
  const bilan = await envoyerAttente();
  // Les fichiers joints partent après les fiches qui les citent, puis on reçoit ce que les autres ont envoyé (y compris leurs fichiers).
  await envoyerPiecesEnAttente(EXPLOITATION_SYNC);
  await recevoirChangements();
  return bilan;
}
