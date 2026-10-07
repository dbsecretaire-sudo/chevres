import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Les tuiles d'activité de l'association : fixes, elles s'empilent sur toute la largeur de la page. */
  grilleTuiles: { gap: 14 },
  tuile: {
    minHeight: 150,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 6,
  },
  tuileInactive: { opacity: 0.55 },
  /** Une tuile sans détail (le gîte) : pas de hauteur minimale, elle ne fait que la place de son icône et de son nom. */
  tuileCompacte: { minHeight: 0 },
  tuileTitre: { fontSize: 22, fontWeight: '800', color: colors.text },
  /** La tuile d'une activité annexe : l'icône à gauche, le compte et la TVA en petit à droite. */
  enteteTuile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reperesTuile: { alignItems: 'flex-end' },
  repereTuile: { fontSize: 11, color: colors.text },
  tuileDetail: { fontSize: 15, color: colors.textMuted },
  tuileBientot: { fontSize: 13, fontStyle: 'italic', color: colors.textMuted, marginTop: 'auto' },

  /** La vue d'un jour : le couloir au milieu, trois chambres de chaque côté. */
  enteteJour2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  boutonJour: { padding: 8 },
  titreJour: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.text },
  couloir: { flexDirection: 'row', gap: 6 },
  colonneChambres: { flex: 1, gap: 8 },
  bandeCouloir: { width: 14, borderRadius: 7, backgroundColor: colors.border },
  titreCote: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textMuted },
  chambre: {
    minHeight: 110,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    gap: 3,
  },
  enteteChambre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /** Un remboursement ou une prestation sous « Autre » : décalé vers la droite. */
  sousLignePaiement: { paddingLeft: 16 },
  chambreOccupee: { backgroundColor: colors.badgeBg, borderColor: colors.primary },
  chambreNumero: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  chambreNom: { fontSize: 14, fontWeight: '700', color: colors.text },
  chambreInfo: { fontSize: 12, color: colors.text },
  chambreAlerte: { fontSize: 12, fontWeight: '700', color: colors.danger },
  chambrePaye: { fontSize: 12, fontWeight: '700', color: colors.primary },
  chambreLibre: { fontSize: 13, fontStyle: 'italic', color: colors.textMuted },
});
