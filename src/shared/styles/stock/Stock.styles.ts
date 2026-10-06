import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
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
