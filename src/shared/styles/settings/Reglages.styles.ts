import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Le titre d'un groupe de l'écran d'organisation. */
  titreGroupe: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: 10,
  },
  warning: { fontSize: 13, color: colors.danger },
  footer: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});
