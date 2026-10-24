import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** De grandes zones à toucher (plus de 100 points de haut) : de quoi les atteindre avec des gants ou les mains sales. */
export const styles = StyleSheet.create({
  contenu: { padding: 12, gap: 12, paddingBottom: 24 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tuile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    justifyContent: 'space-between',
  },
  tuileLarge: { flexBasis: '100%' },
  tuileAppuyee: { backgroundColor: colors.badgeBg },
  haut: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  nombre: { fontSize: 26, fontWeight: '800', color: colors.primary },
  nombreAlerte: { color: colors.danger },
  titre: { fontSize: 18, fontWeight: '700', color: colors.text },
});
