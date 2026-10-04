import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  rowFiltre: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  filtreEffacer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.danger + '22',
  },
  filtreEffacerTexte: { fontSize: 13, fontWeight: '700', color: colors.danger },
  balanceCard: { alignItems: 'center' },
  soldeCompact: { gap: 4, paddingVertical: 10 },
  soldeCompactLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soldeCompactValeur: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  soldeCompactMontant: { fontSize: 18, fontWeight: '800' },
  balanceValeur: { fontSize: 22, fontWeight: '800' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 8 },
  statBloc: { alignItems: 'center', minWidth: 80 },
  statSeparateur: { width: 1, height: 28, backgroundColor: colors.border },
  statLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  statValeur: { fontSize: 15, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 160, gap: 10 },
  /** En-tête de la liste : annule le retrait horizontal de la liste, déjà compris dans le padding du bloc. */
  entete: { marginHorizontal: -16 },
  montant: { fontSize: 15, fontWeight: '700' },
});
