import AsyncStorage from '@react-native-async-storage/async-storage';
import { appeler, ConnexionExpiree, exploitationDeLaConnexion, jetonDeConnexion } from '@/features/sync/synchronisation';
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
import { envoyerPiecesEnAttente, mettreEnFileLesPiecesAnciennes, piecesDeLAppareil, recevoirPiecesManquantes } from '@/features/fichiers/services/piecesSynchro';

/** Nombre maximal de modifications par envoi (le serveur refuse au-delà). */
export const TAILLE_LOT = 200;

/** Taille maximale d'un envoi, en caractères : au-dessus, le serveur refuse la requête entière. */
export const TAILLE_MAX_ENVOI = 3500000;

/** Une fiche plus lourde que cette taille ne part jamais : elle reste sur l'appareil. Elle doit tenir dans un envoi. */
export const TAILLE_MAX_FICHE_ENVOI = 3000000;

/** La taille des données à la dernière synchronisation réussie : un envoi qui les réduit de moitié est suspect. */
const CLE_TAILLE_CONNUE = 'troupeau:v1:sync-taille-connue';

/** En dessous de cette taille, les données sont trop petites pour que le garde-fou compare quoi que ce soit. */
const TAILLE_MINI_CONTROLEE = 100000;

/** La part des données qui doit rester sur l'appareil pour qu'un envoi ne soit pas suspect. */
const PART_MINI_ENVOYABLE = 0.5;

/** Un envoi qui réduit trop les données de l'appareil : il ne part pas sans confirmation. */
export class EnvoiSuspect extends Error {
  constructor(
    readonly tailleLocale: number,
    readonly tailleConnue: number,
  ) {
    super('Envoi suspect');
  }
}

export interface OptionsEnvoi {
  /** Envoyer même si les données de l'appareil ont beaucoup diminué (après une confirmation). */
  forcer?: boolean;
}

/** La taille des données synchronisées de l'appareil, en caractères. */
async function tailleLocale(): Promise<number> {
  let total = 0;
  for (const cle of (await AsyncStorage.getAllKeys()).filter(estSynchronisable)) {
    total += (await AsyncStorage.getItem(cle))?.length ?? 0;
  }
  return total;
}

/** Bloque l'envoi si les données de l'appareil ont presque disparu depuis la dernière synchronisation (une restauration vide, par exemple). */
async function verifierTailleAvantEnvoi(forcer: boolean | undefined): Promise<void> {
  if (forcer) return;
  const connue = Number((await AsyncStorage.getItem(CLE_TAILLE_CONNUE)) ?? 0);
  if (connue < TAILLE_MINI_CONTROLEE) return;
  const locale = await tailleLocale();
  if (locale < connue * PART_MINI_ENVOYABLE) throw new EnvoiSuspect(locale, connue);
}

/** Après une synchronisation réussie, la taille actuelle des données devient la référence. */
async function noterTailleConnue(): Promise<void> {
  await AsyncStorage.setItem(CLE_TAILLE_CONNUE, String(await tailleLocale()));
}

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
export function envoyerAttente(options: OptionsEnvoi = {}): Promise<BilanEnvoi> {
  return enExclusivite(async () => {
    await verifierTailleAvantEnvoi(options.forcer);
    const jeton = await jetonDeConnexion();
    const exploitation = await exploitationDeLaConnexion();
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
        corps: { etablissement: exploitation, modifications: lot },
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
export function recevoirChangements(fichesRecues?: Set<string>): Promise<number> {
  return enExclusivite(async () => {
    const jeton = await jetonDeConnexion();
    const exploitation = await exploitationDeLaConnexion();
    let recues = 0;
    // Les fichiers joints citées par les fiches reçues : téléchargés une fois la réception finie.
    for (;;) {
      const depuis = (await lireCurseur()) ?? 0;
      const { statut, json } = await appeler('tirer', 'GET', {
        jeton,
        parametres: `&etablissement=${exploitation}&depuis=${depuis}`,
      });
      if (statut === 401) throw new ConnexionExpiree(json.erreur);
      if (statut !== 200) throw new Error(json.erreur ?? 'Réception impossible.');

      const enAttente = fichesEnAttente(await lireAttente());
      const zonesModifiees = new Set<string>();
      for (const modification of json.modifications as Modification[]) {
        recues++;
        fichesRecues?.add(cleFiche(modification));
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
        // Toutes les pièces des données de l'appareil, et non seulement celles de cette réception : une pièce pas encore envoyée est reprise ici.
        await recevoirPiecesManquantes(exploitation, await piecesDeLAppareil());
        await noterTailleConnue();
        return recues;
      }
    }
  });
}

/**
 * La toute première synchronisation de cet appareil. Le serveur est lu d'abord : une fiche qu'il a déjà garde sa version, même si cet appareil
 * en a une autre (une valeur par défaut, par exemple, qui écraserait des espèces déjà enregistrées). Seules les fiches que le serveur ne connaît
 * pas encore partent ensuite.
 */
export async function premiereSynchronisation(options: OptionsEnvoi = {}): Promise<BilanEnvoi> {
  if ((await lireCurseur()) !== undefined) return { envoyees: 0, refusees: 0 };
  const fichesDuServeur = new Set<string>();
  await recevoirChangements(fichesDuServeur);
  const cles = (await AsyncStorage.getAllKeys()).filter(estSynchronisable);
  for (const cle of cles) {
    const valeur = await lireValeurLocale(cle);
    if (valeur === undefined) continue;
    await ajouterAttente(modificationsDe(cle, undefined, valeur).filter((m) => !fichesDuServeur.has(cleFiche(m))));
  }
  return envoyerAttente(options);
}

/** Une synchronisation complète : ce que cet appareil a envoyé, puis ce que les autres ont envoyé. */
export async function synchroniser(options: OptionsEnvoi = {}): Promise<BilanEnvoi> {
  await mettreEnFileLesPiecesAnciennes();
  const exploitation = await exploitationDeLaConnexion();
  if ((await lireCurseur()) === undefined) {
    const bilan = await premiereSynchronisation(options);
    await envoyerPiecesEnAttente(exploitation);
    return bilan;
  }
  const bilan = await envoyerAttente(options);
  // Les fichiers joints partent après les fiches qui les citent, puis on reçoit ce que les autres ont envoyé (y compris leurs fichiers).
  await envoyerPiecesEnAttente(exploitation);
  await recevoirChangements();
  return bilan;
}
