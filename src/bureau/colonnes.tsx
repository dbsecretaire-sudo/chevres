import { createContext, useContext, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { useGlobalSearchParams, useIsFocused, usePathname, useRouter, type Href } from 'expo-router';
import { estLaRacineDUneRubrique, ligneDuMenuDe } from '@/bureau/retour';
import { estBureau } from '@/shared/utils/plateforme';

/** À partir de cette largeur de fenêtre (en pixels), la version Windows montre deux colonnes : le menu de la rubrique et l'écran ouvert. */
export const LARGEUR_DEUX_COLONNES = 900;

/** Vrai quand la fenêtre est assez large pour deux colonnes, dans la version Windows seulement (le téléphone ne change pas). */
export function useDeuxColonnes(): boolean {
  const { width } = useWindowDimensions();
  return estBureau() && width >= LARGEUR_DEUX_COLONNES;
}

/** Combien de temps (ms) l'accueil d'une rubrique attend avant de rediriger : de quoi laisser un écran plus profond, demandé d'ailleurs, arriver. */
const DELAI_AVANT_REDIRECTION = 80;

/** Vrai pour ce qui est affiché dans la colonne de gauche (le menu de la rubrique), faux pour l'écran de la colonne de droite. */
export const DansColonneGauche = createContext(false);

/**
 * L'accueil d'une rubrique, ouvert comme un écran, quand il y a deux colonnes : son menu est déjà à gauche, alors la colonne de droite
 * montre directement l'écran principal de la rubrique. Rend la redirection à afficher (rien sinon) ; à appeler en haut de l'écran.
 *
 * L'accueil n'y redirige que lorsqu'il est l'écran affiché : quand on arrive dans la rubrique par un écran plus profond (le courrier
 * d'un contact, un rappel de l'accueil), l'accueil se monte d'abord seul, l'écran demandé n'arrivant qu'un instant plus tard : une
 * redirection immédiate le remplacerait. Elle attend donc un instant, et s'annule si un autre écran est alors affiché.
 */
export function useAccueilEnDeuxColonnes(ecranPrincipal: string) {
  const deuxColonnes = useDeuxColonnes();
  const dansMenu = useContext(DansColonneGauche);
  const affiche = useIsFocused();
  // Un écran plus profond de la rubrique est demandé (l'adresse n'est pas celle de la rubrique) : l'accueil ne redirige pas, il se monte dessous.
  const surLaRacine = estLaRacineDUneRubrique(usePathname());
  const router = useRouter();
  const doitRediriger = deuxColonnes && !dansMenu && affiche && surLaRacine;
  useEffect(() => {
    if (!doitRediriger) return;
    const minuteur = setTimeout(() => router.replace(ecranPrincipal as Href), DELAI_AVANT_REDIRECTION);
    return () => clearTimeout(minuteur);
  }, [doitRediriger, ecranPrincipal, router]);
  return null;
}

/**
 * Dit si une ligne du menu de gauche est celle de l'écran ouvert à droite : même adresse, ou un écran de dessous, et le même type de
 * contrôle quand l'adresse en précise un (contrôles de surface ou des animaux).
 */
export function useLigneActive(): (route: string) => boolean {
  const deuxColonnes = useDeuxColonnes();
  const dansMenu = useContext(DansColonneGauche);
  const adresse = ligneDuMenuDe(usePathname());
  const { famille, onglet } = useGlobalSearchParams<{ famille?: string; onglet?: string }>();
  return (route) => {
    if (!deuxColonnes || !dansMenu) return false;
    const [chemin, requete] = route.split('?');
    if (adresse !== chemin && !adresse.startsWith(`${chemin}/`)) return false;
    const voulus = new URLSearchParams(requete ?? '');
    const voulue = voulus.get('famille');
    const ongletVoulu = voulus.get('onglet');
    // Les écrans d'un même volet (la santé, les boucles, les contrôles) ont chacun leur ligne : seule celle de l'écran ouvert est allumée.
    if (ongletVoulu && ongletVoulu !== onglet) return false;
    return !voulue || voulue === famille;
  };
}
