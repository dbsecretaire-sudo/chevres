import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter, usePathname, useGlobalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAncre } from '@/features/didacticiel/components/AncreVisite';
import { dansLeMenuDeGauche, pageParente } from '@/bureau/retour';
import { ROUTES } from '@/shared/constants/routes';
import { useOrigineRetour, useRetour } from '@/shared/navigation/origineRetour';
import { useDeuxColonnes } from '@/bureau/colonnes';
import { colors } from '@/shared/theme/colors';
import { afficheBureau } from '@/shared/utils/affichage';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/bureau/FlecheRetourBureau.styles';

/**
 * Vrai quand l'écran ouvert est dans le menu de gauche : il n'a alors pas de flèche de retour (le menu est la navigation). Le contrôle
 * ouvert (« ?famille=… ») compte : les contrôles de surface et des animaux sont deux lignes du menu.
 */
export function useFlecheMasquee(): boolean {
  const deuxColonnes = useDeuxColonnes();
  const adresse = usePathname();
  const { famille } = useGlobalSearchParams<{ famille?: string }>();
  return deuxColonnes && dansLeMenuDeGauche(famille ? `${adresse}?famille=${famille}` : adresse);
}

/** L'espace laissé là où la flèche n'est pas : le titre ne colle pas au bord. */
export const EspaceSansFleche = () => <View style={styles.espaceSansFleche} />;

/**
 * La flèche de retour de la version Windows : elle recharge la page parente de l'écran (une facture revient aux écritures…), sans
 * mémoire de la page d'où l'on vient. Les écrans du menu de gauche n'en ont pas.
 */
export function FlecheRetourBureau() {
  const router = useRouter();
  const ancre = useAncre('retour');
  const adresse = usePathname();
  const { famille, groupementId, contact, retour } = useGlobalSearchParams<{
    famille?: string;
    groupementId?: string;
    contact?: string;
    retour?: string;
  }>();
  const masquee = useFlecheMasquee();
  // Une page ouverte depuis un écran en cours (une fiche à compléter pendant un courrier) revient à cet écran.
  const depuis = typeof retour === 'string' && retour.startsWith('/') ? retour : undefined;
  const parent = depuis ?? pageParente(adresse, { famille, groupementId, contact });
  // Une page ouverte depuis un bouton (le groupement sanitaire, depuis l'accueil) revient à l'endroit du clic, pas à l'accueil de sa rubrique.
  const point = useOrigineRetour();
  const retourOrigine = useRetour();
  const depuisUnBouton = !!point && adresse === point.destination.split('?')[0];
  if (masquee || (!parent && !depuisUnBouton)) return <EspaceSansFleche />;
  // Sans nom : la flèche est un dessin seul (les autres boutons d'en-tête, eux, écrivent leur nom à côté).
  return (
    <Pressable
      ref={ancre}
      style={commonStyles.boutonCompact}
      onPress={() => {
        if (depuisUnBouton) return retourOrigine();
        // Une nouvelle écriture revient à la page d'où on l'a ouverte (les lots d'un produit, une fiche…), pas aux écritures.
        if (adresse === ROUTES.COMPTABILITE_NOUVELLE && router.canGoBack()) return router.back();
        router.replace(parent as Href);
      }}
    >
      <Ionicons name="arrow-back" size={24} color={colors.blanc} />
    </Pressable>
  );
}

/** La flèche d'en-tête de la version Windows, à donner à `headerLeft` (rien sur téléphone : l'en-tête garde son retour d'office). */
export const enteteBureau = (): (() => ReactElement) | undefined =>
  afficheBureau() ? () => <FlecheRetourBureau /> : undefined;
