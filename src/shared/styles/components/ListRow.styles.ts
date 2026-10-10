import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  /** Une ligne d'un bloc de liste : le cadre et le fond sont ceux du bloc. */
  rowDansBloc: { borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent' },
  /** La pastille teintée qui porte l'icône d'une ligne de menu. */
  pastille: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowSurlignee: { borderColor: colors.primary, borderWidth: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowTitleGris: { color: colors.textMuted },
});
