import { View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { BandeauBas } from '@/features/accueil/ferme/BandeauBas';
import { estBureau } from '@/shared/utils/plateforme';

/**
 * La barre du bas de toutes les pages du téléphone (à passer en `tabBar` des onglets) : les onglets, et sous eux le bandeau de la ferme, tout en
 * bas, là où le pouce arrive le mieux. Sur l'accueil la barre des onglets est masquée : le bandeau y est seul. Sous Windows, le bandeau reste
 * en haut de la page.
 */
export function BarreDuBas(props: BottomTabBarProps) {
  if (estBureau()) return <BottomTabBar {...props} />;
  // La barre des onglets ne réserve plus la place de la barre de navigation du système : c'est le bandeau, en dessous, qui s'en charge.
  return (
    <View>
      <BottomTabBar {...props} insets={{ ...props.insets, bottom: 0 }} />
      <BandeauBas />
    </View>
  );
}
