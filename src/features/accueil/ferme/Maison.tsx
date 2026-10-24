import { cloneElement, isValidElement, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EntreeDeColonne } from '@/features/accueil/ferme/typesFerme';
import { colors } from '@/shared/theme/colors';

/** La couleur du logo, la même pour tous : un trait vert sombre posé directement sur la carte, sans rond derrière. */
const COULEUR_DU_LOGO = '#2F4A1E';

/** Les mesures d'un intervenant à l'échelle 1 : son logo, et la place de son nom dessous. */
const LOGO = 50;
const NOM = 26;
const LARGEUR = 68;
/** La hauteur d'un intervenant et de son nom, à l'échelle 1 : de quoi les ranger en rangées. */
export const HAUTEUR_DE_MAISON = LOGO + 3 + NOM;
interface Props {
  entree: EntreeDeColonne;
  /** Le rapport à la taille du dessin d'origine : les maisons rapetissent quand la scène est basse. */
  echelle: number;
  onAppui: (cle: string) => void;
  /** La couleur du logo ; absente : le vert sombre de la ferme. */
  couleurLogo?: string;
}

/**
 * Un intervenant de la carte : son logo (le dessin de son bouton, seul, sans rond ni maison derrière) et son nom dessous. Une pastille rouge dit ce
 * qui l'attend (les lots à facturer à l'abattoir, les animaux morts à l'équarrissage). Un appui ouvre sa fiche.
 */
export function Maison({ entree, echelle, onAppui, couleurLogo = COULEUR_DU_LOGO }: Props) {
  const s = (n: number) => Math.round(n * echelle);
  const largeur = s(LARGEUR);
  // Le dessin du bouton est blanc (sur son rond) : ici, il prend la couleur du logo et la taille de la carte.
  const logo = isValidElement(entree.icone)
    ? cloneElement(entree.icone as ReactElement<{ color?: string; size?: number }>, {
        color: couleurLogo,
        size: s(LOGO),
      })
    : entree.icone;
  return (
    <Pressable
      onPress={() => onAppui(entree.cle)}
      style={[styles.maison, { width: largeur + s(16) }]}
      accessibilityRole="button"
      accessibilityLabel={entree.titre}
      hitSlop={4}
    >
      <View style={{ height: s(LOGO), alignItems: 'center', justifyContent: 'center' }}>
        {logo}
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
    top: -4,
    right: -10,
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
