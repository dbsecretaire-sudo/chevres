import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  top: { paddingTop: 48, gap: 6 },
  /** flexGrow : « Retour » reste en bas de l'écran quand la liste est courte. */
  contenu: { flexGrow: 1, gap: 12 },
  /** Une tuile par établissement, l'une sous l'autre, comme les activités du gîte. */
  grille: { gap: 14 },
  carte: {
    minHeight: 110,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 6,
  },
  carteActive: { borderColor: colors.primary },
  /** Le logo à gauche, le bouton crayon à droite, sur leur propre ligne. */
  carteBarre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  carteCrayon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.ajout,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carteNom: { fontSize: 22, fontWeight: '800', color: colors.text },
  carteSousTitre: { fontSize: 14, color: colors.textMuted },
  carteType: { fontSize: 14, color: colors.primaryDark, fontWeight: '600' },
  groupeTitre: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
  /** « Supprimer cet établissement » : épinglé en bas de l'écran, comme « Retour ». */
  supprimer: { marginTop: 'auto' },
  /** Espace sous « Retour » pour que le bouton « + » flottant ne le cache pas. */
});
