import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Sous la ligne de l'établissement : sur toute la largeur de la carte. */
  liste: {
    paddingLeft: 18,
    paddingRight: 14,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: colors.surface,
  },
  ligne: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pastille: { width: 8, height: 8, borderRadius: 4, marginTop: 7, backgroundColor: colors.border },
  pastilleRetard: { backgroundColor: colors.danger },
  texte: { flex: 1, gap: 2 },
  libelle: { fontSize: 15, fontWeight: '600', color: colors.text },
  detail: { fontSize: 13, color: colors.textMuted },
  detailRetard: { color: colors.danger },
});
