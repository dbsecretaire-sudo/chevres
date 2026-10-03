import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  filtres: {
    flexDirection: 'row',
    rowGap: 0,
    columnGap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  list: {
    padding: 16,
    paddingBottom: 160,
    gap: 10,
  },
  resultatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  effacerTexte: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
