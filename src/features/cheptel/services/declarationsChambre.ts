import { piecesDisponibles, pieceExiste } from '@/features/fichiers/services/pieces';
import { ajouterPieceAEnvoyer } from '@/features/fichiers/services/piecesFile';
import type { PieceJointe } from '@/features/fichiers/types';
import { CLE_STOCKAGE, PREFIXE_STOCKAGE } from '@/shared/constants/stockage';
import { ecrireDonnee, lireCurseur, lireValeurLocale, surReception } from '@/shared/storage/depot';

const CLE_DECLARATIONS_CHAMBRE = `${PREFIXE_STOCKAGE}${CLE_STOCKAGE.DECLARATIONS_CHAMBRE}`;

/** Une déclaration par année et espèce : son fichier, ou une liste de fichiers dans l'ancien format. */
export type DeclarationsChambre = Record<string, PieceJointe | PieceJointe[]>;

/**
 * Les déclarations sont dans leur propre zone, synchronisée (les réglages, eux, restent sur l'appareil). Tant qu'elles n'y sont pas encore,
 * on lit celles des réglages, où elles étaient rangées avant.
 */
export async function lireDeclarationsChambre(anciennes: DeclarationsChambre | undefined): Promise<DeclarationsChambre> {
  const zone = (await lireValeurLocale(CLE_DECLARATIONS_CHAMBRE)) as DeclarationsChambre | undefined;
  if (zone !== undefined) return zone;
  // Migration : les déclarations rangées dans les réglages (avant) passent dans leur zone, une fois l'appareil synchronisé, pour que les
  // autres appareils les reçoivent. Un appareil neuf n'écrit rien avant sa première synchronisation.
  if (anciennes && Object.keys(anciennes).length > 0 && (await lireCurseur()) !== undefined) {
    // Les fichiers de ces déclarations partent vers le serveur : ils sont mis dans la file d'envoi (ils n'y étaient pas, rangés dans les réglages).
    if (piecesDisponibles()) {
      for (const valeur of Object.values(anciennes)) {
        for (const piece of Array.isArray(valeur) ? valeur : [valeur]) {
          if (await pieceExiste(piece)) await ajouterPieceAEnvoyer(piece);
        }
      }
    }
    await ecrireDonnee(CLE_DECLARATIONS_CHAMBRE, anciennes);
  }
  return anciennes ?? {};
}

export const ecrireDeclarationsChambre = (declarations: DeclarationsChambre): Promise<void> =>
  ecrireDonnee(CLE_DECLARATIONS_CHAMBRE, declarations);

/** Prévient quand les déclarations arrivent d'un autre appareil. Rend la fonction qui arrête l'écoute. */
export function surDeclarationsRecues(ecouteur: () => void): () => void {
  return surReception((zone) => {
    if (zone === CLE_DECLARATIONS_CHAMBRE) ecouteur();
  });
}
