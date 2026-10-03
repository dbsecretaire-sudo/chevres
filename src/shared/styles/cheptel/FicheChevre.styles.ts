import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  scrollContentFab: { paddingBottom: 160, gap: 12 },
  badges: { flexDirection: 'row', gap: 6 },
  entry: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4, gap: 2 },
});
