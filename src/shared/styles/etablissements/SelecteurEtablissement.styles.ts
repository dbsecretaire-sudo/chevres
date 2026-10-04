import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** Largeur d'une carte d'établissement : trois par ligne. */
const LARGEUR_CARTE = '31%';

export const styles = StyleSheet.create({
  top: { paddingTop: 48, gap: 6 },
  /** flexGrow : « Retour » reste en bas de l'écran quand la liste est courte. */
  contenu: { flexGrow: 1, gap: 12 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  carte: {
    width: LARGEUR_CARTE,
    minHeight: 110,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 4,
  },
  carteActive: { borderColor: colors.primary },
  /** Ligne réservée au bouton crayon, en haut à droite de la carte. */
  carteBarre: { flexDirection: 'row', justifyContent: 'flex-end' },
  carteCrayon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.ajout,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carteNom: { fontSize: 15, fontWeight: '700', color: colors.text },
  carteSousTitre: { fontSize: 12, color: colors.textMuted },
  carteType: { fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  groupeTitre: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
  retour: { marginTop: 'auto' },
  /** « Supprimer cet établissement » : épinglé en bas de l'écran, comme « Retour ». */
  supprimer: { marginTop: 'auto' },
  /** Espace sous « Retour » pour que le bouton « + » flottant ne le cache pas. */
  espaceFab: { height: 70 },
});
