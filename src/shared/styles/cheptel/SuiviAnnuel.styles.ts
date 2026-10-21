import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Les lots de l'année où figure l'animal. */
  lots: { gap: 8, alignItems: 'flex-start' },
  /** « Ajouter un cabri » et « Signaler un avortement », côte à côte sous le suivi de l'année. */
  actions: { flexDirection: 'row', gap: 12 },
  cabri: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ajout,
    backgroundColor: colors.ajoutBadgeBg,
  },
  cabriTexte: { fontSize: 14, fontWeight: '700', color: colors.ajoutFonce, textAlign: 'center' },
  avortement: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerFond,
  },
  avortementTexte: { fontSize: 14, fontWeight: '700', color: colors.dangerFonce, textAlign: 'center', flexShrink: 1 },
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
