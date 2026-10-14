import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  /** Les trois chiffres du plan, côte à côte (l'un sous l'autre sur un écran étroit). */
  tuiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tuile: {
    flexGrow: 1,
    flexBasis: 130,
    backgroundColor: colors.badgeBg,
    borderRadius: 10,
    padding: 10,
    gap: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  /** La vignette dont le détail est déroulé. */
  tuileChoisie: { borderColor: colors.primary },
  /** Le détail d'une vignette, en dessous des vignettes. */
  detail: { backgroundColor: colors.badgeBg, borderRadius: 10, padding: 10, gap: 4 },
  tuileValeur: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  /** Une piste ou une barre : son nom, sa barre, puis son détail. */
  bloc: { gap: 4, paddingVertical: 4 },
  gain: { fontWeight: '800', color: colors.primary },
});
