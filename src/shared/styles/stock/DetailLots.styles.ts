import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Le bouton « Sélectionner… » tant que rien n'est choisi : gris, il devient « Réserver / Facturer » (vert) dès qu'une ligne l'est. */
  selectionnerGris: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.champ,
  },
  selectionnerTexte: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
});
