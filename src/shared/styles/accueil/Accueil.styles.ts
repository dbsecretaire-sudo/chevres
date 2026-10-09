import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: 8,
  },
  /** Les chiffres de l'accueil : une carte, deux rangées de deux, séparées par de fines lignes. */
  grille: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rangee: { flexDirection: 'row', alignItems: 'stretch' },
  stat: { flex: 1, padding: 16, gap: 4, minHeight: 92 },
  statAppuyee: { backgroundColor: colors.background },
  statLibelle: { fontSize: 13, color: colors.textMuted },
  statDetail: { fontSize: 12, color: colors.textMuted },
  separateurVertical: { width: 1, backgroundColor: colors.border },
  separateurHorizontal: { height: 1, backgroundColor: colors.border },
});
