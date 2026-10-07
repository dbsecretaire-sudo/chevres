import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/shared/styles/components/Screen.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

/**
 * Un écran. Dans les onglets, la barre du bas gère déjà le bord inférieur de l'écran (la barre de navigation d'Android) : y
 * ajouter sa marge laissait un vide au-dessus de la barre. `avecBordBas` la rétablit pour un écran hors des onglets.
 */
export function Screen({
  children,
  scroll = true,
  avecBordBas = false,
}: PropsWithChildren<{ scroll?: boolean; avecBordBas?: boolean }>) {
  return (
    <SafeAreaView style={commonStyles.screenBg} edges={avecBordBas ? ['bottom'] : []}>
      {scroll ? (
        <ScrollView style={commonStyles.screenBg} contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      ) : (
        <View style={[commonStyles.screenBg, styles.content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
