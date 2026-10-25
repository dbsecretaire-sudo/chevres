import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { publierMenus, type EntreeMenu } from '@/shared/navigation/menusSections';
import { memoriserNavigationDesOnglets } from '@/shared/navigation/pileDesOnglets';
import { BarreRetourSimple } from '@/features/roles/components/BarreRetourSimple';
import { useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { afficheBureau } from '@/shared/utils/affichage';
import { BarreQuatreRubriques } from '@/features/accueil/shell/BarreQuatreRubriques';

/**
 * La barre du bas de toutes les pages (à passer en `tabBar` des onglets). Sur le téléphone, il n'y a plus de barre d'onglets : les rubriques sont
 * dans le menu « Menus » de la capsule du haut (elle les reçoit d'ici), et le bandeau de la ferme est seul tout en bas, là où le pouce arrive
 * le mieux. Sous Windows, c'est la même disposition : la capsule du haut (année, animal, didacticiel, « Menus »), le bandeau de la ferme en bas.
 */
/** Les quatre rubriques de la capsule « Menus » sous Windows : la même structure que le téléphone, sans barre du bas. */
const RUBRIQUES_BUREAU: { cle: string; libelle: string }[] = [
  { cle: 'cheptel', libelle: 'Chèvres' },
  { cle: 'production', libelle: 'Atelier' },
  { cle: 'visites', libelle: 'Visites' },
  { cle: 'plus', libelle: 'Plus' },
];

export function BarreDuBas(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  // La disposition « comptable » a sa barre d'outils en haut : pas de bandeau en bas.
  const comptable = useDispositionComptable();
  const { role } = useRole();
  const courant = state.routes[state.index]?.name;
  // Sous Windows (hors mode normal, hors disposition comptable) : la capsule ne propose que les quatre rubriques.
  const bureauQuatre = afficheBureau() && role !== ROLE.BERGER && !comptable;
  // La maison du bandeau vide la pile des pages avec cette navigation.
  memoriserNavigationDesOnglets(navigation);
  const entrees: EntreeMenu[] = bureauQuatre
    ? RUBRIQUES_BUREAU.map((r) => ({ cle: r.cle, libelle: r.libelle, actif: courant === r.cle, onPress: () => navigation.navigate(r.cle) }))
    : state.routes
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
  // Le mode normal : un seul bouton « Retour » à la place de la navigation du mode avancé.
  if (role === ROLE.BERGER) return <BarreRetourSimple />;
  if (comptable) return null;
  // Le téléphone : les quatre rubriques du bas. Sous Windows, le bandeau de la ferme reste pour l'instant.
  if (afficheBureau()) return null;
  return <BarreQuatreRubriques {...props} />;
}
