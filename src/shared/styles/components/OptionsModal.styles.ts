import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  optionText: { fontSize: 16, color: colors.text, fontWeight: '600' },
});
