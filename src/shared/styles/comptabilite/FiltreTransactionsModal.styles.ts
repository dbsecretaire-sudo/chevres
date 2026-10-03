import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  titre: { fontSize: 16, fontWeight: '800', color: colors.text },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 4 },
});
