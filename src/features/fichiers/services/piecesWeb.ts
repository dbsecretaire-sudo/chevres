import * as DocumentPicker from 'expo-document-picker';
import { TAILLE_MAX_PIECE } from '@/features/fichiers/services/piecesFile';
import type { PieceJointe } from '@/features/fichiers/types';
import { EXPLOITATION_SYNC } from '@/features/sync/moteur';
import { appeler, ConnexionExpiree, jetonDeConnexion } from '@/features/sync/synchronisation';
import { MIME_FICHIER, MIME_PAR_EXTENSION } from '@/shared/constants/fichiers';
import { todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { TEXTES } from '@/shared/textes';

/** Le contenu d'un fichier du navigateur, en base64 (sans l'en-tête du data URI). */
function versBase64(fichier: Blob): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resoudre(String(lecteur.result).split(',')[1] ?? '');
    lecteur.onerror = () => rejeter(lecteur.error);
    lecteur.readAsDataURL(fichier);
  });
}

/**
 * Sur le web, le fichier choisi part directement vers le serveur : il n'est pas rangé dans le navigateur. Rend sa fiche, ou rien si on annule.
 */
export async function choisirEtEnvoyerPieceWeb(types: string[]): Promise<PieceJointe | undefined> {
  const choix = await DocumentPicker.getDocumentAsync({ type: types, multiple: false, copyToCacheDirectory: false });
  if (choix.canceled) return undefined;
  const [choisi] = choix.assets;
  const fichier = choisi.file;
  if (!fichier) throw new Error(TEXTES.fichiers.erreurAjout);
  if (fichier.size > TAILLE_MAX_PIECE) throw new Error('Ce fichier dépasse 5 Mo : il ne peut pas être envoyé à la ferme.');

  const extension = choisi.name.includes('.') ? choisi.name.split('.').pop()!.toLowerCase() : 'bin';
  const mime = fichier.type || MIME_PAR_EXTENSION[extension] || MIME_FICHIER.INCONNU;
  const piece: PieceJointe = { id: generateId(), nom: choisi.name, extension, mime, ajoutLe: todayISO() };
  const jeton = await jetonDeConnexion();
  const { statut, json } = await appeler('piece_envoyer', 'POST', {
    jeton,
    corps: { etablissement: EXPLOITATION_SYNC, id: piece.id, extension, mime, contenu: await versBase64(fichier) },
  });
  if (statut === 401) throw new ConnexionExpiree(json.erreur);
  if (statut !== 200) throw new Error(json.erreur ?? 'Envoi du fichier impossible.');
  return piece;
}

/** Le fichier joint tel qu'il est sur le serveur, en data URI : pour l'afficher sur le web, où il n'est pas rangé. */
export async function lirePieceDistante(piece: PieceJointe): Promise<string> {
  const jeton = await jetonDeConnexion();
  const { statut, json } = await appeler('piece_recevoir', 'GET', {
    jeton,
    parametres: `&etablissement=${EXPLOITATION_SYNC}&id=${piece.id}`,
  });
  if (statut === 401) throw new ConnexionExpiree(json.erreur);
  if (statut !== 200) throw new Error(json.erreur ?? 'Fichier introuvable sur le serveur.');
  return `data:${json.mime};base64,${json.contenu}`;
}

/** Ouvre un fichier en data URI dans un nouvel onglet (le navigateur bloque l'ouverture directe d'un data URI). */
export function ouvrirPieceWeb(uriDonnees: string): void {
  const [entete, base64] = uriDonnees.split(',');
  const type = entete.slice('data:'.length, entete.indexOf(';'));
  const octets = Uint8Array.from(atob(base64), (caractere) => caractere.charCodeAt(0));
  window.open(URL.createObjectURL(new Blob([octets], { type })), '_blank');
}
