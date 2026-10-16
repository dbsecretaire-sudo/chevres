import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** L'année et le bouton des informations de l'entreprise, côte à côte. */
  ligneAnnee: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boutonInformations: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boutonInformationsTexte: { flexShrink: 1, fontSize: 14, fontWeight: '600', color: colors.text },
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
  /** Version Windows : une rubrique en grande tuile, son nom au centre. */
  tuileRubrique: { flex: 1, minHeight: 100, alignItems: 'center', justifyContent: 'center', padding: 16 },
  tuileRubriqueTexte: { fontSize: 24, fontWeight: '600', color: colors.text },
  statLibelle: { fontSize: 13, color: colors.textMuted },
  statDetail: { fontSize: 12, color: colors.textMuted },
  separateurVertical: { width: 1, backgroundColor: colors.border },
  separateurHorizontal: { height: 1, backgroundColor: colors.border },
});
