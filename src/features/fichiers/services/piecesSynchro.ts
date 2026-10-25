import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { dossierLocal, pieceExiste, uriPiece } from '@/features/fichiers/services/pieces';
import { ajouterPieceAEnvoyer, lirePiecesAEnvoyer, piecesDe, retirerPieceAEnvoyer, TAILLE_MAX_PIECE } from '@/features/fichiers/services/piecesFile';
import type { PieceJointe } from '@/features/fichiers/types';
import { appeler, ConnexionExpiree, jetonDeConnexion } from '@/features/sync/synchronisation';
import { estSynchronisable, lireValeurLocale } from '@/shared/storage/depot';

/** Une fois les fichiers joints déjà présents rangés dans la file : cette migration ne se refait pas. */
const CLE_RATTRAPAGE = 'troupeau:v1:sync-pieces-rattrapees';

/** Envoie au serveur les fichiers joints qui attendent dans la file. Un fichier introuvable sur l'appareil, ou trop lourd, en sort sans être envoyé. */
export async function envoyerPiecesEnAttente(etablissement: string): Promise<number> {
  const jeton = await jetonDeConnexion();
  let envoyees = 0;
  for (const piece of await lirePiecesAEnvoyer()) {
    if (!(await pieceExiste(piece))) {
      await retirerPieceAEnvoyer(piece.id);
      continue;
    }
    const contenu = await FileSystem.readAsStringAsync(uriPiece(piece), { encoding: FileSystem.EncodingType.Base64 });
    // En base64, un fichier pèse un tiers de plus : on compare sa taille réelle.
    if ((contenu.length * 3) / 4 > TAILLE_MAX_PIECE) {
      await retirerPieceAEnvoyer(piece.id);
      continue;
    }
    const { statut, json } = await appeler('piece_envoyer', 'POST', {
      jeton,
      corps: { etablissement, id: piece.id, extension: piece.extension, mime: piece.mime, contenu },
    });
    if (statut === 401) throw new ConnexionExpiree(json.erreur);
    if (statut !== 200) throw new Error(json.erreur ?? 'Envoi du fichier impossible.');
    await retirerPieceAEnvoyer(piece.id);
    envoyees++;
  }
  return envoyees;
}

/** Télécharge les fichiers joints référencés par les fiches reçues et absents de l'appareil. Ceux que les autres n'ont pas encore envoyés sont sautés. */
export async function recevoirPiecesManquantes(etablissement: string, pieces: PieceJointe[]): Promise<number> {
  const jeton = await jetonDeConnexion();
  const uniques = pieces.filter((piece, rang) => pieces.findIndex((autre) => autre.id === piece.id) === rang);
  let recues = 0;
  for (const piece of uniques) {
    if (await pieceExiste(piece)) continue;
    const { statut, json } = await appeler('piece_recevoir', 'GET', {
      jeton,
      parametres: `&etablissement=${etablissement}&id=${piece.id}`,
    });
    if (statut === 401) throw new ConnexionExpiree(json.erreur);
    if (statut === 404) continue;
    if (statut !== 200) throw new Error(json.erreur ?? 'Réception du fichier impossible.');
    await FileSystem.makeDirectoryAsync(dossierLocal(), { intermediates: true });
    await FileSystem.writeAsStringAsync(uriPiece(piece), json.contenu, { encoding: FileSystem.EncodingType.Base64 });
    recues++;
  }
  return recues;
}

/**
 * La première fois que cette version tourne sur l'appareil, les fichiers joints déjà rangés sont mis dans la file : ils partent au prochain envoi.
 * Sans cette migration, ceux d'avant la synchronisation des fichiers ne seraient jamais envoyés.
 */
export async function mettreEnFileLesPiecesAnciennes(): Promise<void> {
  if (await AsyncStorage.getItem(CLE_RATTRAPAGE)) return;
  for (const cle of (await AsyncStorage.getAllKeys()).filter(estSynchronisable)) {
    for (const piece of piecesDe(await lireValeurLocale(cle))) {
      if (await pieceExiste(piece)) await ajouterPieceAEnvoyer(piece);
    }
  }
  await AsyncStorage.setItem(CLE_RATTRAPAGE, 'fait');
}
