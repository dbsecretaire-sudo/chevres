import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Les chiffres clés d'un écran, côte à côte (l'un sous l'autre sur un écran étroit). */
  tuiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tuile: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: colors.badgeBg,
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  /** Un chiffre qui demande de l'attention (un retard, un paiement attendu). */
  tuileAlerte: { backgroundColor: colors.dangerFond },
  tuileValeur: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  tuileValeurAlerte: { color: colors.danger },
  /** Une ligne « libellé à gauche, montant à droite ». */
  ligneMontant: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  /** Une carte de la grille de tarifs ou une ligne de commande : un fond teinté, des champs en colonne. */
  enteteCarte: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  carte: { backgroundColor: colors.badgeBg, borderRadius: 10, padding: 10, gap: 8 },
  /** Les champs d'une ligne de commande : le fromage, puis la quantité et le prix côte à côte. */
  champsLigne: { flexDirection: 'row', gap: 8 },
  champLigne: { flex: 1 },
  /** Un retard ou une alerte, écrit en rouge. */
  alerte: { color: colors.danger, fontWeight: '700' },
  /** Les boutons d'action d'une commande, l'un sous l'autre. */
  actions: { gap: 8 },
});
