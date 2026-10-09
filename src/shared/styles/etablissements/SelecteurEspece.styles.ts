import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  /** Les puces sur une seule ligne, qui défile horizontalement quand elles ne tiennent pas. */
  ligneDefilante: { flexDirection: 'row', gap: 8 },
  puce: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.badgeBg,
  },
  /** Une puce seule (une année, un animal) qui ouvre une liste : à sa taille, collée à gauche. */
  puceListe: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 },
  /** Une puce de choix (année, animal) : blanche, finement cerclée — la couleur est réservée aux actions. */
  puceNeutre: { backgroundColor: colors.surface, borderColor: colors.border },
  /** Une puce active : sa couleur est celle de l'accent. */
  /** Une puce qu'on ne peut pas choisir : estompée. */
  puceGrisee: { opacity: 0.4 },
  texte: { fontSize: 14, fontWeight: '600', color: colors.primaryDark },
});
