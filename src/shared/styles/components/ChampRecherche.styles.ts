import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  champ: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  /** Le texte saisi : le champ prend toute la largeur restante, sans cadre propre (celui du champ suffit). */
  saisie: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 8,
    outlineStyle: 'none' as never,
  },
});
