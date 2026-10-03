import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  ligneLabel: { fontSize: 14, color: colors.text, flexShrink: 1, paddingRight: 8 },
  exclu: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  info: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  aideBloc: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 6 },
  aideTitre: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
});
