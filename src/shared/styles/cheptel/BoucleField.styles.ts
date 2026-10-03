import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  rowStretch: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  indicatifBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: colors.badgeBg,
  },
  indicatifTexte: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  boutonScan: {
    width: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.badgeBg,
  },
});
