import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

/**
 * Styles partagés par plusieurs écrans/composants. Un style utilisé à plusieurs endroits est défini
 * ici une seule fois, sous un nom unique (import : `commonStyles`), plutôt que recopié dans chaque
 * fichier `.styles.ts`.
 */
export const commonStyles = StyleSheet.create({
  // --- Mise en page ---
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  row: { flexDirection: 'row', gap: 12 },
  rowFin: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  rowBetweenTight: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  rowSpaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  /** Un bouton à droite d'un en-tête d'écran : décollé du bord, comme la flèche de retour à gauche. */
  boutonEnteteDroite: { marginRight: 16 },
  headerDroite: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gap2: { gap: 2 },
  gap6: { gap: 6 },
  gap8: { gap: 8 },
  gap10: { gap: 10 },
  textWrap: { flex: 1, gap: 2 },
  scrollContent: { paddingBottom: 100, gap: 12 },
  topPadded: { paddingHorizontal: 16, paddingTop: 16 },
  topBox: { padding: 16, gap: 12 },
  listBox: { padding: 16, gap: 10 },
  listFab: { paddingHorizontal: 16, paddingBottom: 160, paddingTop: 4, gap: 10 },
  listBottom: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  screenBg: { flex: 1, backgroundColor: colors.background },
  separateur: { borderTopWidth: 1, borderTopColor: colors.border, marginVertical: 4 },
  pressed: { opacity: 0.7 },
  /** Une carte sans fond, sans cadre ni marge : son contenu se pose directement sur la page. */
  carteSansFond: { backgroundColor: 'transparent', borderWidth: 0, padding: 0 },
  /** Une carte qui garde son cadre mais sans fond blanc. */
  carteTransparente: { backgroundColor: 'transparent' },
  /** Un champ qu'on ne peut plus modifier : grisé. */
  verrouille: { opacity: 0.55 },

  // --- Textes ---
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subheading: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  valueText: { fontSize: 16, color: colors.text },
  line: { fontSize: 14, color: colors.text },
  lineBold: { fontSize: 14, fontWeight: '700', color: colors.text },
  lineSemiBold: { fontSize: 14, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  message: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  muted: { fontSize: 13, color: colors.textMuted },
  mutedBold: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  mutedItalic: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  labelMuted: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  para: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  paraGras: { fontSize: 13, color: colors.text, lineHeight: 19, fontWeight: '600' },
  caption: { fontSize: 12, color: colors.textMuted },
  captionTop: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  note: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  noteMarge: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  notFound: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  strong: { fontWeight: '700', color: colors.text },
  strongPrimary: { fontWeight: '800', color: colors.primary },
  required: { color: colors.danger },
  textWhite: { color: colors.blanc },

  // --- Composants récurrents ---
  boutonMenu: { padding: 4 },
  boutonCompact: { paddingHorizontal: 12, paddingVertical: 6 },
  boutonPastille: { padding: 2 },
  boutonIcone: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ajoutBadgeBg,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.badgeBg },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  textareaHaute: { minHeight: 80, textAlignVertical: 'top' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.voile,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalSheet: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 12 },
});
