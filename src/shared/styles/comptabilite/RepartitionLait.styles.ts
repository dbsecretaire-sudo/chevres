import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** La largeur (px) de chaque colonne du tableau de répartition du lait. */
export const LARGEURS = { type: 120, part: 86, lait: 84, nombre: 76, argent: 96 } as const;

export const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  /** La ligne qui suit celle du brocciu : la case à cocher et ce que le brocciu demande. */
  ligneBrocciu: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  /** Une ligne du résultat final : le poste à gauche, son montant à droite. */
  ligneResultat: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  entete: { backgroundColor: colors.badgeBg },
  total: { borderTopWidth: 2, borderTopColor: colors.primary, backgroundColor: colors.badgeBg },
  cellule: { paddingVertical: 8, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 2 },
  champPart: {
    flex: 1,
    minWidth: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlign: 'right',
  },
});
