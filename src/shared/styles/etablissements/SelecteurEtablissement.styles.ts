import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  top: { paddingTop: 40, paddingBottom: 4 },
  /** flexGrow : « Supprimer » reste en bas de l'écran quand la liste est courte. */
  contenu: { flexGrow: 1, gap: 12, paddingHorizontal: 16, paddingBottom: 96 },
  /** Les établissements, l'un sous l'autre. */
  grille: { gap: 10 },
  /** Un établissement : une ligne basse (logo, nom et types, crayon). */
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    // Un liseré (transparent, vert pour le dernier utilisé) : tous les logos restent alignés.
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  /** Le dernier établissement utilisé : un liseré vert à gauche. */
  ligneActive: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  lignePressee: { backgroundColor: colors.background },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: { flex: 1, gap: 2 },
  nom: { fontSize: 17, fontWeight: '700', color: colors.text },
  types: { fontSize: 13, color: colors.textMuted },
  crayon: { padding: 4 },
  /** Le badge rouge posé sur le logo d'un établissement : le nombre de choses à traiter. */
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexte: { color: colors.blanc, fontSize: 10, fontWeight: '800' },
  /** Le titre d'un groupe de choix du formulaire d'établissement. */
  groupeTitre: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
  /** « Supprimer cet établissement » : épinglé en bas de l'écran. */
  supprimer: { marginTop: 'auto' },
});
