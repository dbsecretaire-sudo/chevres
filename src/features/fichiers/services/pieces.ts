import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getIdEtablissementActif } from '@/features/etablissements/repository';
import type { PieceJointe } from '@/features/fichiers/types';
import {
  DOSSIER_PIECES_LOCAL,
  EXTENSION_PAR_MIME,
  EXTENSION_PDF,
  LARGEUR_IMAGE_PDF,
  MIME_FICHIER,
  MIME_PAR_EXTENSION,
} from '@/shared/constants/fichiers';
import { todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';

/** Les fichiers joints sont rangés dans l'appareil : indisponibles sur le web. */
export const piecesDisponibles = (): boolean => Platform.OS !== 'web';

/** Un fichier choisi dans le sélecteur de l'appareil, avant d'être rangé. */
export interface FichierChoisi {
  uri: string;
  nom: string;
  mime: string;
}

const dossierLocal = (): string =>
  `${FileSystem.documentDirectory}${DOSSIER_PIECES_LOCAL}/${getIdEtablissementActif()}/`;

/** Où le fichier joint est rangé dans l'appareil. */
export const uriPiece = (piece: PieceJointe): string => `${dossierLocal()}${piece.id}.${piece.extension}`;

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

/** Range une copie du fichier dans l'appareil et renvoie sa fiche. */
export async function rangerFichier(source: FichierChoisi): Promise<PieceJointe> {
  const piece: PieceJointe = {
    id: generateId(),
    nom: source.nom,
    extension: extensionDe(source.nom, source.mime),
    mime: source.mime,
    ajoutLe: todayISO(),
  };
  await FileSystem.makeDirectoryAsync(dossierLocal(), { intermediates: true });
  await FileSystem.copyAsync({ from: source.uri, to: uriPiece(piece) });
  return piece;
}

/** Fabrique un PDF d'une page à partir d'une image (capture d'écran, photo) et renvoie son adresse. */
async function imageEnPdf(uri: string, mime: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const html = `<html><body style="margin:0"><img src="data:${mime};base64,${base64}" style="width:${LARGEUR_IMAGE_PDF}" /></body></html>`;
  const { uri: pdf } = await Print.printToFileAsync({ html, base64: false });
  return pdf;
}

/**
 * Range une capture : une image (PNG, JPEG, capture d'écran du téléphone) est transformée en PDF, un PDF est gardé tel
 * quel. Le PDF reprend le nom de l'image.
 */
export async function rangerCapture(source: FichierChoisi): Promise<PieceJointe> {
  if (!source.mime.startsWith('image/')) return rangerFichier(source);
  const pdf = await imageEnPdf(source.uri, source.mime);
  const nomSansExtension = source.nom.includes('.')
    ? source.nom.slice(0, source.nom.lastIndexOf('.'))
    : source.nom;
  return rangerFichier({ uri: pdf, nom: `${nomSansExtension}.${EXTENSION_PDF}`, mime: MIME_FICHIER.PDF });
}

export async function supprimerPiece(piece: PieceJointe): Promise<void> {
  await FileSystem.deleteAsync(uriPiece(piece), { idempotent: true });
}

export async function pieceExiste(piece: PieceJointe): Promise<boolean> {
  return (await FileSystem.getInfoAsync(uriPiece(piece))).exists;
}

/** Ouvre le fichier avec une autre application de l'appareil (lecteur PDF, Word, Excel, galerie…). */
export async function ouvrirPiece(piece: PieceJointe): Promise<void> {
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
