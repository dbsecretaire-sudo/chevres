import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** Le ticket d'une activité annexe : ses lignes, le bloc d'ajout d'une ligne et le pied avec la TVA et le total. */
export const styles = StyleSheet.create({
  /** Les repas déjà réservés et payés : un bandeau d'information, hors du total. */
  bandeauRepas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.badgeBg,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  texteBandeau: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.primaryDark },

  /** Les lignes déjà enregistrées : l'article et son détail à gauche, le montant de la ligne à droite. */
  lignes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ligneSeparee: { borderTopWidth: 1, borderTopColor: colors.border },
  ligneTexte: { flex: 1, gap: 2 },
  ligneNom: { fontSize: 15, fontWeight: '700', color: colors.text },
  ligneDetail: { fontSize: 12, color: colors.textMuted },
  ligneMontant: { fontSize: 15, fontWeight: '800', color: colors.text },
  retirer: { padding: 4 },

  /** Le bloc d'ajout d'une ligne (bleu, comme tout ajout) : un fond doux, l'article puis la quantité et le bouton. */
  ajout: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  /** La flèche à droite de la ligne des repas : elle mène à la réservation. */
  flecheBandeau: { marginLeft: 'auto' },
  titreAjout: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  rangeeAjout: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compteur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  boutonCompteur: { paddingHorizontal: 12, paddingVertical: 10 },
  valeurCompteur: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.text },
  boutonAjouter: { flex: 1 },

  /** Le pied : la TVA à gauche, le total à droite. */
  pied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tva: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 140 },
  libelleTva: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  total: { fontSize: 20, fontWeight: '800', color: colors.text },
});
