import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  /** Le titre d'une section : blanc sur le bandeau vert. */
  titre: { fontSize: 15, fontWeight: '700', color: colors.blanc },
});
