import { useWindowDimensions } from 'react-native';

/**
 * La largeur maximale de ce que l'application montre : une colonne de la largeur d'un téléphone, centrée, même dans une grande fenêtre ou sur une
 * tablette (les cartes de l'accueil, les bandeaux, les listes). Au-delà, les côtés restent vides.
 */
export const LARGEUR_MAX = 600;

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
