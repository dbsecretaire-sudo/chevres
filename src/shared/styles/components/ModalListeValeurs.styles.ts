import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Les valeurs de la liste : elle défile au-delà de cette hauteur. */
  liste: { maxHeight: 320 },
  /** Le bouton de la corbeille : plus petit que le bouton d'icône d'ordinaire, pour laisser la place au texte. */
  retirer: { width: 38, height: 38, borderRadius: 10 },
  liens: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  lien: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, flexShrink: 1 },
  texteLien: { flexShrink: 1, fontSize: 14, fontWeight: '600', color: colors.primary },
});
