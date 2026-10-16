import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** La largeur de la colonne du menu (la version Windows). */
export const LARGEUR_MENU = 380;

export const styles = StyleSheet.create({
  deuxColonnes: { flex: 1, flexDirection: 'row' },
  gauche: {
    width: LARGEUR_MENU,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
  },
  droite: { flex: 1 },
});
