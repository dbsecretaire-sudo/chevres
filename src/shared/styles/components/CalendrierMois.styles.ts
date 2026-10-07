import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  conteneur: { gap: 6 },
  enteteMois: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titreMois: { fontSize: 18, fontWeight: '800', color: colors.text },
  boutonMois: { padding: 8 },
  ligneSemaine: { flexDirection: 'row', gap: 4 },
  enteteJour: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textMuted },
  /** Une case du calendrier : grande, pour pouvoir y lire un chiffre et y appuyer facilement. */
  caseJour: {
    // flexBasis 0 et minWidth 0 : les sept jours d'une semaine ont toujours exactement la même largeur, quel que soit leur contenu.
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 5,
    alignItems: 'center',
    gap: 4,
  },
  caseVide: { flex: 1, flexBasis: 0, minWidth: 0, minHeight: 72 },
  /** Une case carrée, moins haute (l'Accueil) : sa hauteur est sa largeur. */
  caseCompacte: { minHeight: 0, aspectRatio: 1, padding: 3 },
  caseAujourdhui: { borderColor: colors.primary, borderWidth: 2 },
  casePartielle: { backgroundColor: colors.badgeBg },
  casePleine: { backgroundColor: colors.primary, borderColor: colors.primary },
  caseAlerte: { backgroundColor: colors.danger + '22', borderColor: colors.danger },
  numeroJour: { fontSize: 14, fontWeight: '700', color: colors.text },
  marque: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  textePlein: { color: colors.blanc },
  texteAlerte: { color: colors.danger },
  /** Le point d'exclamation d'une case : une pastille rouge dans son coin haut droit. */
  pastilleAttention: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texteAttention: { fontSize: 11, fontWeight: '800', color: colors.blanc, lineHeight: 14 },
  legende: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
