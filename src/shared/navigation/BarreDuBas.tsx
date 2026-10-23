import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { BandeauBas } from '@/features/accueil/ferme/BandeauBas';
import { publierMenus, type EntreeMenu } from '@/shared/navigation/menusSections';
import { memoriserNavigationDesOnglets } from '@/shared/navigation/pileDesOnglets';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';

/**
 * La barre du bas de toutes les pages (à passer en `tabBar` des onglets). Sur le téléphone, il n'y a plus de barre d'onglets : les rubriques sont
 * dans le menu « Menus » de la capsule du haut (elle les reçoit d'ici), et le bandeau de la ferme est seul tout en bas, là où le pouce arrive
 * le mieux. Sous Windows, c'est la même disposition : la capsule du haut (année, animal, didacticiel, « Menus »), le bandeau de la ferme en bas.
 */
export function BarreDuBas(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  // La disposition « comptable » a sa barre d'outils en haut : pas de bandeau en bas.
  const comptable = useDispositionComptable();
  const courant = state.routes[state.index]?.name;
  // La maison du bandeau vide la pile des pages avec cette navigation.
  memoriserNavigationDesOnglets(navigation);
  const entrees: EntreeMenu[] = state.routes
    // Les écrans cachés des onglets (`href: null` : expo-router les masque par `display: none`) n'ont pas d'entrée : l'accueil, les pages de l'organisation…
    .filter((route) => StyleSheet.flatten(descriptors[route.key]?.options.tabBarItemStyle)?.display !== 'none')
    .map((route) => ({
      cle: route.name,
      libelle: descriptors[route.key].options.title ?? route.name,
      // Les écrans de santé font partie du cheptel : sa rubrique y reste en évidence.
      actif: courant === route.name || (route.name === 'cheptel' && courant === 'sante'),
      onPress: () => {
        // Comme un appui sur un onglet : les écouteurs de l'écran (retour à sa première page) s'exécutent d'abord.
        const evenement = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!evenement.defaultPrevented) navigation.navigate(route.name, route.params);
      },
    }));
  // Publiée à chaque affichage : le menu connaît toujours la rubrique ouverte et celles de l'établissement actif.
  const signature = entrees.map((e) => `${e.cle}:${e.libelle}:${e.actif}`).join('|');
  useEffect(() => {
    publierMenus(entrees);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- les entrées sont recréées à chaque rendu : la signature dit quand elles changent
  }, [signature]);
  return comptable ? null : <BandeauBas />;
}
