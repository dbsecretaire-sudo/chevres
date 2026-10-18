import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  scrollContentFab: { paddingBottom: 160, gap: 12 },
  ongletsEtAjout: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ajouterUnCabri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ajout,
    backgroundColor: colors.ajoutBadgeBg,
  },
  ajouterUnCabriTexte: { fontSize: 13, fontWeight: '700', color: colors.ajoutFonce },
  badges: { flexDirection: 'row', gap: 6 },
  entry: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4, gap: 2 },
});
