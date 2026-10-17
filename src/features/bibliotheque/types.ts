import type { PieceJointe } from '@/features/fichiers/types';

/** Un document (PDF) généré par l'application, gardé dans la bibliothèque pour garder un historique. */
export interface DocumentGenere {
  id: string;
  /** Ce que le document est (« Suivi des mouvements », « Carnet de mise bas »…). */
  titre: string;
  /** Le nom du fichier généré. */
  nomFichier: string;
  /** Quand il a été généré (date et heure, ISO). */
  genereLe: string;
  /** Le fichier lui-même, rangé dans l'appareil comme une pièce jointe (il suit les sauvegardes et Google Drive). */
  piece: PieceJointe;
}
