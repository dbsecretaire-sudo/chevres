import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  placeholder: { fontSize: 16, color: colors.textMuted },
  lien: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lienTexte: { fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: colors.text },
  recherche: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  liste: { flexShrink: 1 },
  /** Le titre d'un groupe d'options (ex : « Cheptel concerné »), au-dessus de sa première ligne. */
  puces: { marginBottom: 8 },
  groupe: { paddingTop: 10, paddingBottom: 6, fontSize: 15, color: colors.text },
  /** Une option d'un groupe : décalée sous le titre de son groupe. */
  optionGroupee: { marginLeft: 16 },
  option: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  optionSelected: { backgroundColor: colors.badgeBg },
  aucunResultat: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },
});
