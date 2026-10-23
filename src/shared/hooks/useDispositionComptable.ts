import { useWindowDimensions } from 'react-native';
import { afficheSobre } from '@/shared/utils/affichage';

/** À partir de cette largeur de fenêtre, l'affichage sobre prend la disposition d'un logiciel de comptabilité : un menu à gauche et de grands tableaux. */
export const LARGEUR_DISPOSITION_COMPTABLE = 820;

/**
 * Vrai en affichage sobre quand la fenêtre est assez large : l'application n'est plus une colonne de téléphone, mais un poste de comptabilité — le menu en arbre à gauche,
 * la barre d'outils en haut (année, animal, solde, rappels, enregistrement) et les listes en tableaux pleine largeur. Une fenêtre étroite garde la colonne.
 */
export function useDispositionComptable(): boolean {
  const { width } = useWindowDimensions();
  return afficheSobre() && width >= LARGEUR_DISPOSITION_COMPTABLE;
}
