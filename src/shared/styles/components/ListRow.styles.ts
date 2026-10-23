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
  /** Une ligne rangée sous celle du dessus (un contrat sous son assureur) : décalée vers la droite. */
  rowRetrait: { paddingLeft: 14 + 30 },
  /** La pastille teintée qui porte l'icône d'une ligne de menu. */
  pastille: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** L'image (la tête d'un animal) dans la pastille. */
  image: { width: 30, height: 31 },
  /** La ligne du menu dont l'écran est ouvert à côté : un fond plus soutenu et une barre à gauche. */
  rowActive: { backgroundColor: colors.ligneActive, borderLeftWidth: 4, borderLeftColor: colors.primary },
  rowSurlignee: { borderColor: colors.primary, borderWidth: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowTitleGris: { color: colors.textMuted },
});
