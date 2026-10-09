import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Le prix de vente du lait : le libellé d'un côté, le prix et son crayon de l'autre, sans déborder de la carte. */
  ligneDuPrix: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  libelleDuPrix: { flexShrink: 0 },
  prixDuLitre: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  texteDuPrix: { flexShrink: 1, textAlign: 'right' },
  /** Le niveau d'un article et la commande de déplacement, côte à côte au bout de la ligne. */
  fin: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  /** La feuille des statistiques : elle défile quand il y en a beaucoup. */
  /** Un mois de l'historique, décalé sous le titre de sa carte. */
  moisHistorique: { paddingLeft: 16 },
  enteteCarte: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  /** Le tableau des litres de lait par fromage, mois par mois : une ligne de mois, une ligne de litres. */
  tableauMois: { gap: 4, marginTop: 4 },
  ligneMois: { flexDirection: 'row', alignItems: 'center' },
  etiquetteMois: { width: 34, fontSize: 11, fontWeight: '700', color: colors.textMuted },
  celluleMois: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.text },
  celluleMoisTitre: { fontWeight: '700', color: colors.textMuted },
  celluleMoisVide: { color: colors.textMuted },
});
