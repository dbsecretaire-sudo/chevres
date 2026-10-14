import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  piste: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.badgeBg,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  segment: { height: '100%' },
});
