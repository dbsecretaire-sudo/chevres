import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  conteneur: { position: 'relative' },
  fleche: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background + 'E6',
  },
  gauche: { left: 0 },
  droite: { right: 0 },
});
