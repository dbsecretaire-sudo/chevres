import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  titreLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitreValeur: { fontSize: 15, fontWeight: '800', color: colors.text },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  ligneLabel: { fontSize: 14, color: colors.text, flexShrink: 1 },
  ligneValeurs: { flexDirection: 'row', gap: 6, alignItems: 'baseline' },
  voirPlus: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ajout,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  datesAbattoir: { marginBottom: 2, gap: 1 },
  ligneDateAbattoir: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 20 },
  dateAbattoirNombre: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
