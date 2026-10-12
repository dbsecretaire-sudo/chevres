import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  apercu: { width: '100%', borderRadius: 6, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  remplit: { width: '100%', height: '100%' },
  /** La petite icône d'agrandissement, en bas à droite de l'aperçu. */
  loupe: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: colors.voileCamera,
    borderRadius: 12,
    padding: 4,
  },
  fond: { flex: 1, backgroundColor: colors.noir },
  /** L'image entière, centrée dans l'écran (sous la croix de fermeture). */
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 56 },
  fermer: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: colors.voileCamera,
    borderRadius: 20,
    padding: 6,
  },
});
