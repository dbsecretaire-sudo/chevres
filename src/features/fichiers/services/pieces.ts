import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getIdEtablissementActif } from '@/features/etablissements/repository';
import type { PieceJointe } from '@/features/fichiers/types';
import { ADRESSE_FICHIERS_BUREAU, DOSSIER_PIECES_LOCAL, EXTENSION_PAR_MIME, MIME_FICHIER, MIME_PAR_EXTENSION } from '@/shared/constants/fichiers';
import { todayISO } from '@/shared/utils/dates';
import { estBureau } from '@/shared/utils/plateforme';
import { generateId } from '@/shared/utils/id';
import { ajouterPieceAEnvoyer, TAILLE_MAX_PIECE } from '@/features/fichiers/services/piecesFile';

/** Les fichiers joints sont rangés dans l'appareil : indisponibles sur le web, mais pas dans la version Windows. */
export const piecesDisponibles = (): boolean => Platform.OS !== 'web' || estBureau();

/** Un fichier choisi dans le sélecteur de l'appareil, avant d'être rangé. */
export interface FichierChoisi {
  uri: string;
  nom: string;
  mime: string;
}

/** Le dossier des fichiers joints de l'établissement actif (la synchronisation y range aussi ceux qu'elle reçoit). */
export const dossierLocal = (): string =>
  `${FileSystem.documentDirectory}${DOSSIER_PIECES_LOCAL}/${getIdEtablissementActif()}/`;

/** Où le fichier joint est rangé dans l'appareil. */
export const uriPiece = (piece: PieceJointe): string => `${dossierLocal()}${piece.id}.${piece.extension}`;

/** L'adresse pour afficher le fichier dans une image : sur l'ordinateur, la fenêtre ne lit pas un chemin du disque directement. */
export const uriAffichagePiece = (piece: PieceJointe): string =>
  estBureau() ? `${ADRESSE_FICHIERS_BUREAU}${encodeURIComponent(uriPiece(piece))}` : uriPiece(piece);

/** L'extension d'un fichier : celle de son nom, sinon celle de son type. */
function extensionDe(nom: string, mime: string): string {
  const depuisNom = nom.includes('.') ? nom.split('.').pop()!.toLowerCase() : '';
  return depuisNom || EXTENSION_PAR_MIME[mime] || 'bin';
}

/** Le type d'un fichier : celui que donne le sélecteur, sinon celui de son extension. */
function mimeDe(nom: string, mime?: string): string {
  if (mime && mime !== MIME_FICHIER.INCONNU) return mime;
  return MIME_PAR_EXTENSION[extensionDe(nom, '')] ?? MIME_FICHIER.INCONNU;
}

/** Ouvre le sélecteur de fichiers de l'appareil (les photos et captures y figurent) ; rien si on annule. */
export async function choisirFichiers(types: string[], multiple = false): Promise<FichierChoisi[]> {
  const choix = await DocumentPicker.getDocumentAsync({ type: types, multiple, copyToCacheDirectory: true });
  if (choix.canceled) return [];
  return choix.assets.map((a) => ({ uri: a.uri, nom: a.name, mime: mimeDe(a.name, a.mimeType) }));
}

/** Range une copie du fichier dans l'appareil, la met en file pour le serveur de la ferme, et renvoie sa fiche. Un fichier trop lourd est refusé. */
export async function rangerFichier(source: FichierChoisi): Promise<PieceJointe> {
  // La taille n'est connue que sur le téléphone : sur l'ordinateur, le fichier est rangé sans cette vérification.
  const taille = ((await FileSystem.getInfoAsync(source.uri)) as { size?: number }).size;
  if (taille && taille > TAILLE_MAX_PIECE) throw new Error('Ce fichier dépasse 5 Mo : il ne peut pas être envoyé à la ferme.');
  const piece: PieceJointe = {
    id: generateId(),
    nom: source.nom,
    extension: extensionDe(source.nom, source.mime),
    mime: source.mime,
    ajoutLe: todayISO(),
  };
  await FileSystem.makeDirectoryAsync(dossierLocal(), { intermediates: true });
  await FileSystem.copyAsync({ from: source.uri, to: uriPiece(piece) });
  await ajouterPieceAEnvoyer(piece);
  return piece;
}

export async function supprimerPiece(piece: PieceJointe): Promise<void> {
  await FileSystem.deleteAsync(uriPiece(piece), { idempotent: true });
}

export async function pieceExiste(piece: PieceJointe): Promise<boolean> {
  return (await FileSystem.getInfoAsync(uriPiece(piece))).exists;
}

/** Ouvre le fichier avec une autre application de l'appareil (lecteur PDF, Word, Excel, galerie…). */
export async function ouvrirPiece(piece: PieceJointe): Promise<void> {
  // Sur l'ordinateur, le fichier s'ouvre avec le programme de Windows qui lui convient (Word, Excel, lecteur PDF…).
  if (estBureau()) return window.bureau?.fichiers.ouvrir(uriPiece(piece));
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(uriPiece(piece), { mimeType: piece.mime, dialogTitle: piece.nom });
}

export const lirePieceBase64 = (piece: PieceJointe): Promise<string> =>
  FileSystem.readAsStringAsync(uriPiece(piece), { encoding: FileSystem.EncodingType.Base64 });

/** Range un fichier reçu (sauvegarde ou Drive) sous sa fiche. */
export async function ecrirePieceBase64(piece: PieceJointe, base64: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(dossierLocal(), { intermediates: true });
  await FileSystem.writeAsStringAsync(uriPiece(piece), base64, { encoding: FileSystem.EncodingType.Base64 });
}
