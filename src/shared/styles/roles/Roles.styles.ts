import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** De très grands boutons, une action chacun : faits pour être touchés avec des gants, sans réfléchir. */
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  contenu: { flex: 1, padding: 16, gap: 16, justifyContent: 'center' },
  titre: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  grosBouton: {
    minHeight: 150,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  grosBoutonClair: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary },
  grosBoutonBas: { minHeight: 90 },
  /** Les gros boutons se rangent par deux sur une ligne (un seul, seul sur sa ligne, prend toute la largeur). */
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moitie: { flexBasis: '47%', flexGrow: 1, minHeight: 130, padding: 12 },
  grosTexteMoitie: { fontSize: 20 },
  grosBoutonAppuye: { opacity: 0.85 },
  grosTexte: { fontSize: 24, fontWeight: '800', color: colors.blanc, textAlign: 'center' },
  grosTexteClair: { color: colors.primary },
  aide: { fontSize: 16, color: colors.blanc, textAlign: 'center' },
  aideClaire: { color: colors.textMuted },
  discret: { alignSelf: 'center', padding: 16 },
  discretTexte: { fontSize: 16, color: colors.textMuted, textDecorationLine: 'underline' },
  /** Le scanner s'écrit sur fond sombre (la caméra) : ses textes sont blancs. */
  scanner: { flex: 1, backgroundColor: colors.noir },
  messageClair: { color: colors.blanc },
  message: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  detail: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  erreur: { fontSize: 20, fontWeight: '700', color: colors.danger, textAlign: 'center' },
  rangeeNombres: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  nombre: {
    width: '45%',
    minHeight: 110,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreTexte: { fontSize: 48, fontWeight: '800', color: colors.blanc },
  coche: { alignSelf: 'center' },
});
