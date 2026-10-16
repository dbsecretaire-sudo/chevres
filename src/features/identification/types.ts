import type { PieceJointe } from '@/features/fichiers/types';
import type { NATURE_DOCUMENT_IDENTIFICATION } from '@/shared/constants/identification';

/**
 * Un document d'identification de l'exploitation : un titre, sa nature (identification ou installation) et ses pièces scannées
 * (images ou PDF). L'exploitation en range autant qu'il faut.
 */
export interface DocumentIdentification {
  id: string;
  titre: string;
  nature: (typeof NATURE_DOCUMENT_IDENTIFICATION)[number];
  /** Date du document (AAAA-MM-JJ). */
  date: string;
  notes?: string;
  fichiers?: PieceJointe[];
}
