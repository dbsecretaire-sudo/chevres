import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from 'expo-router';
import { definirBarreAjoutBleue } from '@/shared/navigation/barreAjout';
import { colors } from '@/shared/theme/colors';

/**
 * Teinte la barre d'onglets en bleu tant que l'écran d'ajout est affiché, et la remet à la
 * normale en la quittant — signal visuel qu'on est dans un flux de création (à poser dans
 * chaque écran "nouvelle"/"ajout"). Avec `actif` à faux (l'écran sert aussi à modifier : on y
 * modifie un élément existant), la barre reste verte.
 */
export function useAjoutTabBarBleu(actif = true) {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (!actif) return;
      const tabs = navigation.getParent();
      definirBarreAjoutBleue(true);
      tabs?.setOptions({
        tabBarStyle: { backgroundColor: colors.ajout },
        tabBarActiveTintColor: colors.ajoutIconActif,
        tabBarInactiveTintColor: colors.ajoutIconInactif,
      } as never);
      return () => {
        definirBarreAjoutBleue(false);
        tabs?.setOptions({
          // undefined ne fait pas retomber sur le vert de screenOptions : il retombe sur le bleu
          // par défaut de React Navigation. On remet donc explicitement les vraies valeurs normales.
          tabBarStyle: { backgroundColor: colors.surface },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        } as never);
      };
    }, [navigation, actif]),
  );
}
