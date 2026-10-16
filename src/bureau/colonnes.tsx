import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { Redirect, useGlobalSearchParams, useIsFocused, usePathname, type Href } from 'expo-router';
import { estBureau } from '@/shared/utils/plateforme';

/** À partir de cette largeur de fenêtre (en pixels), la version Windows montre deux colonnes : le menu de la rubrique et l'écran ouvert. */
export const LARGEUR_DEUX_COLONNES = 900;

/** Vrai quand la fenêtre est assez large pour deux colonnes, dans la version Windows seulement (le téléphone ne change pas). */
export function useDeuxColonnes(): boolean {
  const { width } = useWindowDimensions();
  return estBureau() && width >= LARGEUR_DEUX_COLONNES;
}

/** Vrai pour ce qui est affiché dans la colonne de gauche (le menu de la rubrique), faux pour l'écran de la colonne de droite. */
export const DansColonneGauche = createContext(false);

/**
 * L'accueil d'une rubrique, ouvert comme un écran, quand il y a deux colonnes : son menu est déjà à gauche, alors la colonne de droite
 * montre directement l'écran principal de la rubrique. Rend la redirection à afficher (rien sinon) ; à appeler en haut de l'écran.
 *
 * L'accueil n'y redirige que lorsqu'il est l'écran affiché : quand on arrive dans la rubrique par un écran plus profond (le courrier
 * d'un contact, depuis un autre onglet), l'accueil se monte d'abord dessous, et sa redirection écraserait l'écran demandé.
 */
export function useAccueilEnDeuxColonnes(ecranPrincipal: string) {
  const deuxColonnes = useDeuxColonnes();
  const dansMenu = useContext(DansColonneGauche);
  const affiche = useIsFocused();
  return deuxColonnes && !dansMenu && affiche ? <Redirect href={ecranPrincipal as Href} /> : null;
}

/**
 * Dit si une ligne du menu de gauche est celle de l'écran ouvert à droite : même adresse, ou un écran de dessous, et le même type de
 * contrôle quand l'adresse en précise un (contrôles de surface ou des animaux).
 */
export function useLigneActive(): (route: string) => boolean {
  const deuxColonnes = useDeuxColonnes();
  const dansMenu = useContext(DansColonneGauche);
  const adresse = usePathname();
  const { famille } = useGlobalSearchParams<{ famille?: string }>();
  return (route) => {
    if (!deuxColonnes || !dansMenu) return false;
    const [chemin, requete] = route.split('?');
    if (adresse !== chemin && !adresse.startsWith(`${chemin}/`)) return false;
    const voulue = new URLSearchParams(requete ?? '').get('famille');
    return !voulue || voulue === famille;
  };
}
