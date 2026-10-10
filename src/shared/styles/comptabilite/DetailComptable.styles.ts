import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** L'étoile rouge des ventes sans facture. */
  asterisque: { color: colors.danger, fontWeight: '800' },
  titreSection: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 4 },
  groupe: { borderBottomWidth: 1, borderBottomColor: colors.border },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ligneInterne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  ligneTotal: { borderBottomWidth: 0, paddingTop: 12 },
  montant: { fontSize: 15, fontWeight: '600' },
  montantTotal: { fontSize: 17, fontWeight: '800' },
  voirPlus: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 2 },
  sousDetail: { paddingLeft: 12, paddingBottom: 8, gap: 4 },
});
