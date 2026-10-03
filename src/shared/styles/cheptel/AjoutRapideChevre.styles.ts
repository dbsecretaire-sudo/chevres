import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  question: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stepperBouton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValeur: { fontSize: 24, fontWeight: '800', color: colors.text, minWidth: 32, textAlign: 'center' },
});
