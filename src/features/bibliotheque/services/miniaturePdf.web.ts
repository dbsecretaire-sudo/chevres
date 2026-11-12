import * as pdfjs from 'pdfjs-dist';
// Le travail de lecture du PDF se fait dans ce même fil : pdf.js le trouve par cette importation (pas de fichier séparé à servir).
import 'pdfjs-dist/build/pdf.worker.min.mjs';
import { piecesDisponibles, uriAffichagePiece } from '@/features/fichiers/services/pieces';
import { lirePieceDistante } from '@/features/fichiers/services/piecesWeb';
import type { PieceJointe } from '@/features/fichiers/types';

/** La largeur de la miniature, en pixels. */
export const LARGEUR_MINIATURE_PDF = 160;

/** Les miniatures déjà produites (ou en cours), par pièce : une pièce n'est lue qu'une fois. */
const miniatures = new Map<string, Promise<string | undefined>>();

/** Les octets du PDF : le fichier de l'ordinateur, ou celui reçu du serveur (la PWA). */
async function octetsDuPdf(piece: PieceJointe): Promise<ArrayBuffer> {
  const adresse = piecesDisponibles() ? uriAffichagePiece(piece) : await lirePieceDistante(piece);
  const reponse = await fetch(adresse);
  if (!reponse.ok) throw new Error('Fichier introuvable.');
  return reponse.arrayBuffer();
}

/**
 * L'image de la première page d'un PDF (web : ordinateur et PWA). Rend undefined si le fichier manque ou ne se lit pas : on affiche alors une icône.
 * Le résultat est gardé en mémoire ; un échec est refait la fois suivante.
 */
export function miniaturePdf(piece: PieceJointe): Promise<string | undefined> {
  const dejaFaite = miniatures.get(piece.id);
  if (dejaFaite) return dejaFaite;
  const faite = (async () => {
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await octetsDuPdf(piece)) }).promise;
    const page = await pdf.getPage(1);
    const echelle = LARGEUR_MINIATURE_PDF / page.getViewport({ scale: 1 }).width;
    const vue = page.getViewport({ scale: echelle });
    const canevas = document.createElement('canvas');
    canevas.width = Math.floor(vue.width);
    canevas.height = Math.floor(vue.height);
    const contexte = canevas.getContext('2d');
    if (!contexte) return undefined;
    await page.render({ canvasContext: contexte, canvas: canevas, viewport: vue }).promise;
    return canevas.toDataURL('image/jpeg', 0.8);
  })().catch(() => undefined);
  miniatures.set(piece.id, faite);
  void faite.then((uri) => {
    if (!uri) miniatures.delete(piece.id);
  });
  return faite;
}
