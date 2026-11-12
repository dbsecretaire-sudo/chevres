import * as DocumentPicker from 'expo-document-picker';
import { TAILLE_MAX_PIECE } from '@/features/fichiers/services/piecesFile';
import type { PieceJointe } from '@/features/fichiers/types';
import { appeler, ConnexionExpiree, exploitationDeLaConnexion, jetonDeConnexion } from '@/features/sync/synchronisation';
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
    corps: { etablissement: await exploitationDeLaConnexion(), id: piece.id, extension, mime, contenu: await versBase64(fichier) },
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
    parametres: `&etablissement=${await exploitationDeLaConnexion()}&id=${piece.id}`,
  });
  if (statut === 401) throw new ConnexionExpiree(json.erreur);
  if (statut !== 200) throw new Error(json.erreur ?? 'Fichier introuvable sur le serveur.');
  return `data:${json.mime};base64,${json.contenu}`;
}

/**
 * Envoie directement au serveur un fichier choisi sur le web (son adresse de navigateur), et rend sa fiche. Il n'est rangé nulle part dans le
 * navigateur : le serveur le garde, et il est ensuite disponible depuis tous les appareils.
 */
export async function envoyerPieceWeb(source: { uri: string; nom: string; mime: string }): Promise<PieceJointe> {
  const fichier = await (await fetch(source.uri)).blob();
  if (fichier.size > TAILLE_MAX_PIECE) throw new Error('Ce fichier dépasse 5 Mo : il ne peut pas être envoyé à la ferme.');
  const extension = source.nom.includes('.') ? source.nom.split('.').pop()!.toLowerCase() : 'bin';
  const piece: PieceJointe = {
    id: generateId(),
    nom: source.nom,
    extension,
    mime: source.mime || fichier.type || MIME_FICHIER.INCONNU,
    ajoutLe: todayISO(),
  };
  const jeton = await jetonDeConnexion();
  const { statut, json } = await appeler('piece_envoyer', 'POST', {
    jeton,
    corps: {
      etablissement: await exploitationDeLaConnexion(),
      id: piece.id,
      extension,
      mime: piece.mime,
      contenu: await versBase64(fichier),
    },
  });
  if (statut === 401) throw new ConnexionExpiree(json.erreur);
  if (statut !== 200) throw new Error(json.erreur ?? 'Envoi du fichier impossible.');
  return piece;
}

/** Ouvre un fichier en data URI dans un nouvel onglet (le navigateur bloque l'ouverture directe d'un data URI). */
export function ouvrirPieceWeb(uriDonnees: string): void {
  const [entete, base64] = uriDonnees.split(',');
  const type = entete.slice('data:'.length, entete.indexOf(';'));
  const octets = Uint8Array.from(atob(base64), (caractere) => caractere.charCodeAt(0));
  window.open(URL.createObjectURL(new Blob([octets], { type })), '_blank');
}

/**
 * Ouvre, sur le web, un fichier joint lu depuis le serveur, dans un nouvel onglet. L'onglet s'ouvre tout de suite : le navigateur bloque une
 * fenêtre ouverte après une attente (la lecture du serveur), et le fichier y est mis dès qu'il est reçu.
 */
export async function ouvrirPieceDistante(piece: PieceJointe): Promise<void> {
  const onglet = window.open('', '_blank');
  try {
    const uri = await lirePieceDistante(piece);
    const [entete, base64] = uri.split(',');
    const type = entete.slice('data:'.length, entete.indexOf(';'));
    const octets = Uint8Array.from(atob(base64), (caractere) => caractere.charCodeAt(0));
    const adresse = URL.createObjectURL(new Blob([octets], { type }));
    if (onglet) onglet.location.href = adresse;
    else window.open(adresse, '_blank');
  } catch (erreur) {
    onglet?.close();
    throw erreur;
  }
}
