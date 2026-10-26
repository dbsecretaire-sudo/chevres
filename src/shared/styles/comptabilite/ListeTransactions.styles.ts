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
  /** La carte du solde, comme sur la maquette : verte, le texte en blanc. */
  carteVerte: { backgroundColor: colors.primary, borderColor: colors.primary, gap: 12, width: '100%', alignSelf: 'stretch' },
  enteteVerte: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  boutonDetailsVerte: { borderWidth: 1, borderColor: colors.blanc, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  soldeBlanc: { fontSize: 30, fontWeight: '800', color: colors.blanc },
  statsVertes: { flexDirection: 'row', gap: 10 },
  boiteVerte: { flex: 1, backgroundColor: colors.primaryDark, borderRadius: 12, padding: 10, gap: 2 },
  texteBlanc: { fontSize: 13, color: colors.blanc },
  valeurBlanche: { fontSize: 16, fontWeight: '700', color: colors.blanc },
  /** Le lien vers le détail par catégorie, en haut à droite de la carte dépliée. */
  soldeDetails: { position: 'absolute', top: 12, right: 14 },
  soldeDetailsTexte: { fontSize: 13, color: colors.primary, textDecorationLine: 'underline' },
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
  list: { paddingHorizontal: 16, paddingBottom: 160 },
  /** En-tête de la liste : pas de retrait propre, annule le retrait horizontal de la liste, déjà compris dans le padding du bloc. */
  entete: { marginHorizontal: -16, paddingTop: 4 },
  montant: { fontSize: 15, fontWeight: '700' },
});
