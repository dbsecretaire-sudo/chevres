import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  zone: { position: 'relative', marginVertical: 6 },
  /** Les courbes d'une série, posées sur toute la zone du dessin. */
  serie: { ...StyleSheet.absoluteFill },
  segment: { position: 'absolute', height: 2, borderRadius: 1 },
  point: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  /** Le cercle d'un point de vigilance, autour du point. */
  vigilance: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 2.5 },
  libelles: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  libelle: { fontSize: 11, color: colors.textMuted },
});
