import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 16, fontWeight: '700', color: colors.blanc, textAlign: 'center' },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  pressedLight: { opacity: 0.85 },
});
