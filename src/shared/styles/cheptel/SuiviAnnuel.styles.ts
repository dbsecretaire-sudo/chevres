import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Les lots de l'année à gauche, le bouton d'avortement à droite. */
  lotsEtAvortement: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  lots: { flex: 1, gap: 8, alignItems: 'flex-start' },
  avortement: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerFond,
  },
  avortementTexte: { fontSize: 12, color: colors.text, textAlign: 'center' },
});
