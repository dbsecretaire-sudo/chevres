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
  /** Un bouton compact (Oui / Non sous un clavier) : une seule ligne, l'icône à côté du mot, à peine plus haut qu'un bouton de saisie. */
  grosBoutonCompact: { minHeight: 62, flexDirection: 'row', flexWrap: 'nowrap', gap: 10, paddingVertical: 8 },
  grosTexteCompact: { fontSize: 22 },
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
  /** Les petits d'une naissance : une rangée de 0 à 6 pour les femelles, une pour les mâles. */
  /** Les lettres du clavier d'un numéro de lot : de petites touches sur plusieurs lignes. */
  lettresRangee: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 330 },
  lettreChoix: {
    width: 54,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.blanc,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lettreChoixTexte: { fontSize: 22, fontWeight: '800', color: colors.primary },
  /** L'étiquette rouge d'un gros bouton (« 3 à envoyer ») : posée sur son coin en haut à droite, à cheval sur le bord. */
  grosEtiquette: { position: 'absolute', top: -13, right: 10, backgroundColor: colors.danger, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  grosEtiquetteTexte: { fontSize: 15, fontWeight: '800', color: colors.blanc, textAlign: 'center' },
  /** Une page de saisie qui défile quand elle est plus haute que l'écran, et se centre sinon. */
  contenuDefilant: { flexGrow: 1, justifyContent: 'center', padding: 16, gap: 12 },
  affichageNumero: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D4C8',
    backgroundColor: colors.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  affichageNumeroTexte: { fontSize: 30, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: 2 },
  sexeTitre: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  petitsRangee: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  petitChoix: {
    width: 88,
    height: 62,
    borderRadius: 14,
    backgroundColor: colors.blanc,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Une touche plus étroite : quatre tiennent sur une ligne (la dernière rangée du clavier avec la virgule). */
  petitChoixEtroit: { width: 66, height: 62, borderRadius: 14, backgroundColor: colors.blanc, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  petitChoixActif: { backgroundColor: colors.primary },
  petitChoixTexte: { fontSize: 26, fontWeight: '800', color: colors.primary },
  petitChoixTexteActif: { color: colors.blanc },
  coche: { alignSelf: 'center' },
});
