import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Les lots de l'année à gauche, le bouton d'avortement à droite. */
  lotsEtAvortement: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  lots: { flex: 1, gap: 8, alignItems: 'flex-start' },
  avortement: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerFond,
  },
  avortementTexte: { fontSize: 12, fontWeight: '700', color: colors.dangerFonce, textAlign: 'center' },
});

/** L'ascendance : les parents inconnus, un bouton rond chacun (♀ la mère, ♂ le père). */
export const stylesAscendance = StyleSheet.create({
  boutons: { flexDirection: 'row', gap: 16, paddingHorizontal: 8, paddingVertical: 4 },
  rond: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ajout,
    backgroundColor: colors.ajoutBadgeBg,
  },
});
