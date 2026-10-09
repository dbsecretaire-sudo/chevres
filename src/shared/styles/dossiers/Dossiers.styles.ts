import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** La grille des dossiers : trois cartes par ligne. */
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  carte: {
    width: '31%',
    minHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 6,
  },
  /** Carte à deux colonnes, pour des noms plus longs (les sous-dossiers d'un client). */
  carteLarge: { width: '48%' },
  carteTitre: { fontSize: 14, fontWeight: '700', color: colors.text },
  carteDetail: { fontSize: 11, color: colors.textMuted },
  /** « À facturer » sur la carte d'un client : le point d'exclamation et le mot sur une ligne. */
  carteAFacturer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  carteAlerte: { fontSize: 11, fontWeight: '700', color: colors.danger },
  titreSection: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6 },
  /** Boutons d'en-tête (menu burger, menu d'un dossier) : icône blanche sur le bandeau vert. */
  boutonEntete: { paddingHorizontal: 12, paddingVertical: 6 },
  ligneEtiquettes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  etiquette: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
    backgroundColor: colors.badgeBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  /** Une ligne modifiable de la structure type : le nom et le bouton pour la retirer. */
  ligneStructure: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  /** Fenêtre de saisie d'un nom. */
  champNom: { marginVertical: 8 },
});
