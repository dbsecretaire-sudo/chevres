import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/shared/styles/components/ScreenList.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

/**
 * Un écran. Dans les onglets, la barre du bas gère déjà le bord inférieur de l'écran (la barre de navigation d'Android) : y
 * ajouter sa marge laissait un vide au-dessus de la barre. `avecBordBas` la rétablit pour un écran hors des onglets.
 */
export function Screen({
  children,
  scroll = true,
  avecBordBas = false,
  transparent = false,
}: PropsWithChildren<{ scroll?: boolean; avecBordBas?: boolean; transparent?: boolean }>) {
  // Transparent : l'écran laisse voir le fond de ce qui l'entoure (le panneau vert du cadre de jeu du stock).
  const fond = transparent ? { backgroundColor: 'transparent' } : commonStyles.screenBg;
  return (
    <SafeAreaView style={fond} edges={avecBordBas ? ['bottom'] : []}>
      {scroll ? (
        <ScrollView style={fond} contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      ) : (
        <View style={[fond, styles.content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
