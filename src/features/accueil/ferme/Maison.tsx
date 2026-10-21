import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EntreeDeColonne } from '@/features/accueil/ferme/typesFerme';
import { colors } from '@/shared/theme/colors';

/** Les couleurs d'une maison : son mur et son toit (le toit est aussi celui de son enseigne). */
export interface PaletteDeMaison {
  mur: string;
  toit: string;
}

/** Les couleurs de chaque intervenant : on le reconnaît à son bâtiment (l'abattoir en pierre sombre, le garage en bleu, la pompe en rouge…). */
const PALETTES: Record<string, PaletteDeMaison> = {
  abattoir: { mur: '#CDBFB6', toit: '#7A4B3A' },
  veterinaire: { mur: '#F4F1EA', toit: '#3F8A5A' },
  aliments: { mur: '#EBD58B', toit: '#A8742A' },
  equarrissage: { mur: '#C3C8CC', toit: '#555F66' },
  carburant: { mur: '#F5E4DA', toit: '#C0392B' },
  garage: { mur: '#CBD9EA', toit: '#35577A' },
  assurance: { mur: '#D9E6F4', toit: '#2F5D8C' },
  banque: { mur: '#EAE2D1', toit: '#6B5B3E' },
  groupement: { mur: '#E8CDA6', toit: '#8A5A2B' },
  groupementSanitaire: { mur: '#EAF4EC', toit: '#2E7D4F' },
  laiterie: { mur: '#EAF2F8', toit: '#3A7CA5' },
  particuliers: { mur: '#F6E4D2', toit: '#B5532F' },
  surfacesCommerciales: { mur: '#E9E2F0', toit: '#6A4C93' },
  entreprises: { mur: '#DCE1E6', toit: '#3E4C59' },
  emballages: { mur: '#E5D3B3', toit: '#7B5E2E' },
  qualiteLait: { mur: '#FAE8D6', toit: '#D2793B' },
};
const PALETTE_PAR_DEFAUT: PaletteDeMaison = { mur: '#EEE8DA', toit: '#6B5B3E' };

/** Les mesures du dessin d'origine d'une maison (sa largeur, la hauteur de son toit et de son mur, celle de son nom). */
const LARGEUR = 68;
const TOIT = 18;
const MUR = 38;
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
 * Une maison de la carte : un intervenant. Son toit et son mur se reconnaissent de loin ; sur sa façade, son enseigne (le dessin de son bouton) ; dessous,
 * son nom. Une pastille rouge dit ce qui l'attend (les lots à facturer à l'abattoir, les animaux morts à l'équarrissage). Un appui ouvre sa fiche.
 */
export function Maison({ entree, echelle, onAppui }: Props) {
  const palette = PALETTES[entree.cle] ?? PALETTE_PAR_DEFAUT;
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
            width: s(28),
            height: s(28),
            borderRadius: s(14),
            backgroundColor: palette.toit,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ transform: [{ scale: 0.62 * echelle }] }}>{entree.icone}</View>
        </View>
        {entree.pastille ? (
          <View style={styles.pastille}>
            <Text style={styles.pastilleTexte}>{entree.pastille}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.nom, { fontSize: Math.max(9, s(10)) }]} numberOfLines={2}>
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
    paddingHorizontal: 5,
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
