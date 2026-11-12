import { useWindowDimensions } from 'react-native';
import { afficheTablette } from '@/shared/utils/affichage';

/**
 * La largeur maximale de ce que l'application montre : une colonne de la largeur d'un téléphone, centrée, même dans une grande fenêtre ou sur une
 * tablette (les cartes de l'accueil, les bandeaux, les listes). Au-delà, les côtés restent vides. Sur la tablette (l'interface Windows mobile), la colonne
 * est plus large, pour que les écrans en tiennent davantage.
 */
export const LARGEUR_MAX = afficheTablette() ? 1100 : 600;

/** Le nombre de tuiles de front dans une grille : deux sur un téléphone, trois sur la tablette. */
export const COLONNES_DE_GRILLE = afficheTablette() ? 3 : 2;

/** La largeur d'une tuile d'une grille (un peu moins que sa part, pour l'espace entre les tuiles). */
export const LARGEUR_TUILE = `${Math.floor(100 / COLONNES_DE_GRILLE) - 2}%` as `${number}%`;

/** Le style d'un bloc qui prend toute la largeur permise, sans dépasser `LARGEUR_MAX`, centré. */
export const colonneCentree = { width: '100%', maxWidth: LARGEUR_MAX, alignSelf: 'center' } as const;

/** La largeur de référence d'un téléphone : les tailles du dessin d'origine valent pour elle. */
const LARGEUR_DE_REFERENCE = 375;

/**
 * Le rapport entre la largeur dont dispose l'application (au plus `LARGEUR_MAX`) et celle d'un téléphone : de quoi agrandir les icônes et les
 * textes des bandeaux sur un grand écran, ou les réduire un peu sur un petit. Entre 0,9 et 1,4.
 */
export function useEchelle(): number {
  const { width } = useWindowDimensions();
  return Math.max(0.9, Math.min(1.4, Math.min(width, LARGEUR_MAX) / LARGEUR_DE_REFERENCE));
}
