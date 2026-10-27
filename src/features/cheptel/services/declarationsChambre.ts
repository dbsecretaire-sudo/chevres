import type { PieceJointe } from '@/features/fichiers/types';
import { CLE_STOCKAGE, PREFIXE_STOCKAGE } from '@/shared/constants/stockage';
import { ecrireDonnee, lireValeurLocale, surReception } from '@/shared/storage/depot';

export const CLE_DECLARATIONS_CHAMBRE = `${PREFIXE_STOCKAGE}${CLE_STOCKAGE.DECLARATIONS_CHAMBRE}`;

/** Une déclaration par année et espèce : son fichier, ou une liste de fichiers dans l'ancien format. */
export type DeclarationsChambre = Record<string, PieceJointe | PieceJointe[]>;

/**
 * Les déclarations sont dans leur propre zone, synchronisée (les réglages, eux, restent sur l'appareil). Tant qu'elles n'y sont pas encore,
 * on lit celles des réglages, où elles étaient rangées avant.
 */
export async function lireDeclarationsChambre(anciennes: DeclarationsChambre | undefined): Promise<DeclarationsChambre> {
  return ((await lireValeurLocale(CLE_DECLARATIONS_CHAMBRE)) as DeclarationsChambre | undefined) ?? anciennes ?? {};
}

export const ecrireDeclarationsChambre = (declarations: DeclarationsChambre): Promise<void> =>
  ecrireDonnee(CLE_DECLARATIONS_CHAMBRE, declarations);

/** Prévient quand les déclarations arrivent d'un autre appareil. Rend la fonction qui arrête l'écoute. */
export function surDeclarationsRecues(ecouteur: () => void): () => void {
  return surReception((zone) => {
    if (zone === CLE_DECLARATIONS_CHAMBRE) ecouteur();
  });
}
