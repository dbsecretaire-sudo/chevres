import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Les chiffres clés du journal : deux par ligne. */
  grilleStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tuileStat: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 2,
  },
  tuileStatGrande: { flexBasis: '100%' },
  statValeur: { fontSize: 20, fontWeight: '800', color: colors.text },
  statValeurGrande: { fontSize: 28 },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  statAide: { fontSize: 11, fontStyle: 'italic', color: colors.textMuted },
  gain: { color: colors.success },
  perte: { color: colors.danger },

  observation: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  puceObservation: { fontSize: 14, color: colors.primary, fontWeight: '800' },
  texteObservation: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },

  ligneRepartition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  repartitionTexte: { flex: 1, gap: 1 },
  repartitionNom: { fontSize: 14, fontWeight: '700', color: colors.text },
  repartitionMontant: { fontSize: 14, fontWeight: '800' },

  courbe: { position: 'relative', marginVertical: 6 },
  ligneZero: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border },
  segment: { position: 'absolute', height: 2, borderRadius: 1 },
  pointCourbe: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },

  resultatLigne: { fontSize: 14, fontWeight: '800' },
  resume: { gap: 4 },
});
