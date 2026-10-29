import * as FileSystem from 'expo-file-system/legacy';
import { lirePieceBase64, uriPiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { estBureau } from '@/shared/utils/plateforme';

/**
 * Enregistre une copie du document dans un dossier de l'appareil que la personne choisit (Téléchargements, Documents…) : sur Android,
 * le sélecteur de dossiers du système ; sur Windows, « Enregistrer sous ». Renvoie false si la personne annule.
 */
export async function enregistrerSurAppareil(piece: PieceJointe): Promise<boolean> {
  if (estBureau()) {
    return (await window.bureau?.fichiers.enregistrerSous(uriPiece(piece), piece.nom, piece.nom)) ?? false;
  }
  const dossier = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!dossier.granted) return false;
  // Le système ajoute l'extension selon le type du fichier : on la retire du nom pour ne pas la doubler.
  const nom = piece.nom.replace(/\.[^.]+$/, '');
  const fichier = await FileSystem.StorageAccessFramework.createFileAsync(dossier.directoryUri, nom, piece.mime);
  await FileSystem.writeAsStringAsync(fichier, await lirePieceBase64(piece), { encoding: FileSystem.EncodingType.Base64 });
  return true;
}
