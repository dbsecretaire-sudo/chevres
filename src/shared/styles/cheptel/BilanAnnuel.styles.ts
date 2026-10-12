import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  titreLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  /** Le libellé d'une ligne qui ouvre un détail : souligné, comme un lien. */
  libelleLien: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ajout,
    textDecorationLine: 'underline',
  },
  /** Le montant d'une aide sous la prime prévisionnelle : en retrait. */
  ligneDetail: { paddingLeft: 16 },
  /** La légende de l'alerte des primes : en italique, après un astérisque rouge. */
  legendePrime: { fontSize: 13, fontStyle: 'italic', color: colors.text },
  /** Le champ de l'effectif déclaré : étroit, à droite de son libellé. */
  champDeclare: { width: 110 },
  titreTexte: { flexShrink: 1 },
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
