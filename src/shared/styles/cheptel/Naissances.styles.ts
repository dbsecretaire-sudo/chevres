import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Le bouton du carnet et son bilan, tout près des filtres. */
  carnet: { paddingHorizontal: 16, gap: 10 },
  cabritsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  cabritChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.badgeBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cabritChipText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
});
