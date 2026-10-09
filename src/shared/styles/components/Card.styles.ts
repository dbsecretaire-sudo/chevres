import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  /** Une carte posée dans un bloc de liste : le cadre et le fond sont ceux du bloc. */
  dansBloc: { borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent' },
});
