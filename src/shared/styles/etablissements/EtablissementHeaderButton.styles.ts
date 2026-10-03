import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  bouton: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 220, paddingRight: 16 },
  nom: { flexShrink: 1, fontSize: 17, fontWeight: '700', color: colors.blanc },
});
