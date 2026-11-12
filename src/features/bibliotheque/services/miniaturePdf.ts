import PdfThumbnail from 'react-native-pdf-thumbnail';
import { pieceExiste, uriAffichagePiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';

/** La largeur de la miniature, en pixels. */
export const LARGEUR_MINIATURE_PDF = 160;

/** Les miniatures déjà produites (ou en cours), par pièce : une pièce n'est lue qu'une fois. */
const miniatures = new Map<string, Promise<string | undefined>>();

/**
 * L'image de la première page d'un PDF, en fichier local (Android). Rend undefined si le fichier manque ou ne se lit pas : on affiche alors une icône.
 * Le résultat est gardé en mémoire ; un échec est refait la fois suivante.
 */
export function miniaturePdf(piece: PieceJointe): Promise<string | undefined> {
  const dejaFaite = miniatures.get(piece.id);
  if (dejaFaite) return dejaFaite;
  const faite = (async () => {
    if (!(await pieceExiste(piece))) return undefined;
    const { uri } = await PdfThumbnail.generate(uriAffichagePiece(piece), 0, { maxWidth: LARGEUR_MINIATURE_PDF });
    return uri;
  })().catch(() => undefined);
  miniatures.set(piece.id, faite);
  void faite.then((uri) => {
    if (!uri) miniatures.delete(piece.id);
  });
  return faite;
}
