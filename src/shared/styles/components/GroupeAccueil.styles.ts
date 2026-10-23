import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  groupe: { gap: 6 },
  ligneTitre: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  balance: { fontSize: 13, fontWeight: '700' },
  titre: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text,
  },
});
