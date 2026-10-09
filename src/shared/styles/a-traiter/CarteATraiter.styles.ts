import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  carte: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  titre: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 6,
  },
  ligne: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  ligneSeparee: { borderTopWidth: 1, borderTopColor: colors.border },
  pastille: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  texte: { flex: 1, gap: 2 },
  libelle: { fontSize: 15, fontWeight: '600', color: colors.text },
  detail: { fontSize: 13, color: colors.textMuted },
  detailRetard: { color: colors.danger },
  plus: { fontSize: 13, fontWeight: '700', color: colors.primary, paddingTop: 6 },
});
