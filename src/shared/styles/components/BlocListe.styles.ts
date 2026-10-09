import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  bloc: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  /** Une ligne d'une liste défilante : les côtés du bloc, et le trait du haut (qui sépare de la ligne précédente). */
  ligneDeBloc: {
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  premiere: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  derniere: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14, borderBottomWidth: 1 },
  /** Le trait entre deux lignes d'un bloc. */
  separation: { borderTopWidth: 1, borderTopColor: colors.border },
});
