import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', gap: 8 },
  puce: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.badgeBg },
});
