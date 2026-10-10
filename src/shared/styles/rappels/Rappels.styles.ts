import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  conteneur: { gap: 8 },
  enTete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  icones: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  titre: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  texte: { flex: 1, gap: 2 },
  titreLigne: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  libelle: { fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 },
  detail: { fontSize: 13, color: colors.textMuted },
  detailRetard: { color: colors.danger },
});
