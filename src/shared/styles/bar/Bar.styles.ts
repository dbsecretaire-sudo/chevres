import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Une boisson à vendre : son nom, sa quantité, puis le prix qui suit la quantité. */
  ligneBoisson: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  nomBoisson: { fontSize: 15, fontWeight: '700', color: colors.text },
  quantiteLigne: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  boutonQuantite: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantite: { minWidth: 32, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text },
  prixLigne: { fontSize: 13, color: colors.textMuted },
  prixLigneActif: { color: colors.primaryDark, fontWeight: '700' },
  total: { fontSize: 16, fontWeight: '800', color: colors.text },
});
