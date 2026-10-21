import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  titre: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.primaryDark,
  },
  aide: { fontSize: 13, color: colors.textMuted, marginTop: -4 },
  champs: { gap: 12 },
});
