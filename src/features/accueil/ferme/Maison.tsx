import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EntreeDeColonne } from '@/features/accueil/ferme/typesFerme';
import { colors } from '@/shared/theme/colors';

/** Les couleurs d'une maison : son mur et son toit (le toit est aussi celui de son enseigne). */
export interface PaletteDeMaison {
  mur: string;
  toit: string;
}

/** Les maisons ont toutes les mêmes couleurs (un mur crème, un toit brique) : c'est l'enseigne sur la façade qui dit qui est l'intervenant. */
const PALETTE: PaletteDeMaison = { mur: '#F6EEDC', toit: '#9C5B3A' };

/** Les mesures du dessin d'origine d'une maison (sa largeur, la hauteur de son toit et de son mur, celle de son nom). */
const LARGEUR = 68;
const TOIT = 18;
const MUR = 46;
const NOM = 26;
/** La hauteur d'une maison et de son nom, à l'échelle 1 : de quoi les ranger en rangées. */
export const HAUTEUR_DE_MAISON = TOIT + MUR + 3 + NOM;
/** La largeur d'une maison avec la place de son nom, à l'échelle 1. */
export const LARGEUR_DE_MAISON = LARGEUR + 16;

interface Props {
  entree: EntreeDeColonne;
  /** Le rapport à la taille du dessin d'origine : les maisons rapetissent quand la scène est basse. */
  echelle: number;
  onAppui: (cle: string) => void;
}

/**
 * Une maison de la carte : un intervenant. Son toit et son mur se reconnaissent de loin ; sur sa façade, son enseigne (le dessin de son bouton, en grand) ; dessous,
 * son nom. Une pastille rouge dit ce qui l'attend (les lots à facturer à l'abattoir, les animaux morts à l'équarrissage). Un appui ouvre sa fiche.
 */
export function Maison({ entree, echelle, onAppui }: Props) {
  const palette = PALETTE;
  const s = (n: number) => Math.round(n * echelle);
  const largeur = s(LARGEUR);
  return (
    <Pressable
      onPress={() => onAppui(entree.cle)}
      style={[styles.maison, { width: largeur + s(16) }]}
      accessibilityRole="button"
      accessibilityLabel={entree.titre}
      hitSlop={4}
    >
      {/* Le toit : un triangle. */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: largeur / 2,
          borderRightWidth: largeur / 2,
          borderBottomWidth: s(TOIT),
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: palette.toit,
        }}
      />
      <View
        style={[
          styles.mur,
          { width: largeur - s(8), height: s(MUR), backgroundColor: palette.mur, borderColor: palette.toit },
        ]}
      >
        {/* L'enseigne : le dessin du bouton, sur un disque de la couleur du toit. */}
        <View
          style={{
            width: s(38),
            height: s(38),
            borderRadius: s(19),
            backgroundColor: palette.toit,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ transform: [{ scale: 0.86 * echelle }] }}>{entree.icone}</View>
        </View>
        {entree.pastille ? (
          <View style={styles.pastille}>
            <Text style={styles.pastilleTexte}>{entree.pastille}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.nom, { fontSize: Math.max(9, s(10)), width: largeur + s(26) }]} numberOfLines={2}>
        {entree.titre}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  maison: { alignItems: 'center' },
  mur: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  nom: {
    marginTop: 3,
    fontWeight: '700',
    color: '#2F4A1E',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  pastille: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.blanc,
  },
  pastilleTexte: { color: colors.blanc, fontSize: 11, fontWeight: '800' },
});
