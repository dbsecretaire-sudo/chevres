import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Le champ des animaux concernés d'un acte : il ouvre la liste des boucles de la visite. */
  champAnimaux: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  texteAnimaux: { flex: 1, fontSize: 16, color: colors.text },
  placeholder: { color: colors.textMuted },
});
