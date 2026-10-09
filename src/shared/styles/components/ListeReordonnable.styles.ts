import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** La zone à toucher pour déplacer une ligne : assez large pour le doigt. */
  poignee: { padding: 8, margin: -4 },
  /** La ligne tenue au doigt : au-dessus des autres, légèrement relevée. */
  enDeplacement: {
    zIndex: 10,
    elevation: 8,
    opacity: 0.95,
    backgroundColor: colors.surface,
    shadowColor: colors.noir,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
