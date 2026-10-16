import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  titreAxe: { fontSize: 13, fontWeight: '700', color: colors.primary },
  zone: { flexDirection: 'row', alignItems: 'flex-start' },
  /** La colonne des graduations, à gauche du dessin. */
  axe: { width: 52, borderRightWidth: 1, borderRightColor: colors.primary, marginRight: 4 },
  graduation: { position: 'absolute', right: 6, fontSize: 11, color: colors.primary },
  colonnes: { flex: 1, flexDirection: 'row' },
  colonne: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  /** Le pied d'une colonne : la barre posée sur la ligne de base, avec un repère léger à chaque graduation. */
  pied: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  repere: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border },
  barre: { width: '62%', maxWidth: 56, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  barrePleine: { backgroundColor: colors.primary },
  /** Le complément empilé (les activités touristiques) : plein, d'une teinte plus claire, au-dessus de la colonne. */
  barreComplement: { backgroundColor: colors.ajout, borderRadius: 2 },
  barreCernee: {
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  barreChoisie: { backgroundColor: colors.badgeBg },
  libelle: { textAlign: 'center', marginTop: 4 },
  valeur: { textAlign: 'center' },
});
