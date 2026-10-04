import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  puce: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.badgeBg,
  },
  puceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  texte: { fontSize: 14, fontWeight: '600', color: colors.primaryDark },
  texteActif: { color: colors.blanc },
});
