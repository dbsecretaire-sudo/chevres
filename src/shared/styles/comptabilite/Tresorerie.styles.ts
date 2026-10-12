import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  courbe: { position: 'relative', marginVertical: 6 },
  /** Les lignes de repère : le zéro, et le seuil d'alerte. */
  ligneZero: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border },
  ligneSeuil: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.danger,
    opacity: 0.5,
  },
  segment: { position: 'absolute', height: 2, borderRadius: 1 },
  point: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
  /** Un point sous le seuil d'alerte : un cercle rouge autour. */
  alerte: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  libelles: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  libelle: { fontSize: 11, color: colors.textMuted, width: 16, textAlign: 'center' },
  prevision: { opacity: 0.45 },
});
