import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Le « OU » entre le formulaire et le bouton d'import. */
  ou: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
  /** Les éléments d'un établissement déroulé, décalés sous son en-tête. */
  liste: { gap: 10, paddingLeft: 14 },
});
