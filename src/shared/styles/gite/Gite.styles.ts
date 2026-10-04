import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Les tuiles d'activité de l'accueil de l'association : trois par ligne. */
  grilleTuiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tuile: {
    width: '31%',
    minHeight: 130,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 4,
  },
  tuileInactive: { opacity: 0.55 },
  tuileTitre: { fontSize: 15, fontWeight: '800', color: colors.text },
  tuileDetail: { fontSize: 12, color: colors.textMuted },
  tuileBientot: { fontSize: 11, fontStyle: 'italic', color: colors.textMuted, marginTop: 'auto' },

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
  chambreOccupee: { backgroundColor: colors.badgeBg, borderColor: colors.primary },
  chambreNumero: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  chambreNom: { fontSize: 14, fontWeight: '700', color: colors.text },
  chambreInfo: { fontSize: 12, color: colors.text },
  chambreDates: { fontSize: 11, color: colors.textMuted },
  chambreLibre: { fontSize: 13, fontStyle: 'italic', color: colors.textMuted },
});
