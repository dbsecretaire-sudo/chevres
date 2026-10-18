import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Le bouton du carnet et son bilan, tout près des filtres. */
  carnet: { paddingHorizontal: 16, gap: 10 },
  /** Une mise bas : ses lignes se touchent (titre, nombre de petits, petits), sans blanc entre elles. */
  carte: { gap: 2, paddingVertical: 10 },
  liste: { paddingBottom: 24 },
  cabritsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  cabritChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.badgeBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cabritChipText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
});
