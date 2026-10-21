import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AncreBouton, EntreeDeColonne } from '@/features/accueil/ferme/typesFerme';
import { colors } from '@/shared/theme/colors';

/** Les couleurs d'un grand bâtiment : son toit (et son enseigne), son mur, le fond de ses compartiments et leur bord. */
export interface PaletteDeBatiment {
  toit: string;
  mur: string;
  compartiment: string;
  bord: string;
}

interface Props {
  /** Le nom du bâtiment, sur son toit (la bergerie : « Gestion »). */
  titre: string;
  /** Un décor entre le toit et les compartiments (le mur en inox de la fromagerie). */
  decor?: ReactNode;
  entrees: readonly EntreeDeColonne[];
  /** Un appui sur un compartiment, avec sa place à l'écran (de quoi en faire sortir des bulles). */
  onAppui: (cle: string, ancre: AncreBouton) => void;
  palette: PaletteDeBatiment;
  /** Sa hauteur, une fois dessiné : la scène en laisse la place aux maisons et au troupeau. */
  surHauteur?: (hauteur: number) => void;
}

/** Un compartiment : une porte du bâtiment, avec son dessin et son nom. */
function Compartiment({
  entree,
  palette,
  onAppui,
}: {
  entree: EntreeDeColonne;
  palette: PaletteDeBatiment;
  onAppui: Props['onAppui'];
}) {
  const ref = useRef<View>(null);
  const appuyer = () =>
    ref.current?.measureInWindow((x, y, largeur, hauteur) => onAppui(entree.cle, { x, y, largeur, hauteur }));
  return (
    <Pressable
      ref={ref}
      collapsable={false}
      style={[styles.compartiment, { backgroundColor: palette.compartiment, borderColor: palette.bord }]}
      onPress={appuyer}
      accessibilityRole="button"
      accessibilityLabel={entree.titre}
    >
      <View style={[styles.disque, { backgroundColor: entree.couleur ?? palette.toit }]}>
        <View style={{ transform: [{ scale: 0.7 }] }}>{entree.icone}</View>
        {entree.pastille ? (
          <View style={styles.pastille}>
            <Text style={styles.pastilleTexte}>{entree.pastille}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.nom} numberOfLines={2}>
        {entree.titre}
      </Text>
    </Pressable>
  );
}

/**
 * Un grand bâtiment de la scène, dont les compartiments sont les menus de la gestion : la bergerie de l'exploitation, la fromagerie du travail du
 * produit. Un toit arrondi avec son nom, puis le mur et ses six portes, chacune avec son dessin et son nom : on touche directement celle qu'on veut.
 */
export function Batiment({ titre, decor, entrees, onAppui, palette, surHauteur }: Props) {
  return (
    <View style={styles.batiment} onLayout={(e) => surHauteur?.(Math.round(e.nativeEvent.layout.height))}>
      <View style={[styles.toit, { backgroundColor: palette.toit }]}>
        <Text style={styles.titre}>{titre}</Text>
      </View>
      <View style={[styles.mur, { backgroundColor: palette.mur, borderColor: palette.toit }]}>
        {decor}
        <View style={styles.compartiments}>
          {entrees.map((e) => (
            <Compartiment key={e.cle} entree={e} palette={palette} onAppui={onAppui} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  batiment: { alignSelf: 'stretch' },
  toit: {
    height: 30,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: { color: colors.blanc, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  mur: { borderWidth: 3, borderTopWidth: 0, overflow: 'hidden' },
  compartiments: { flexDirection: 'row', flexWrap: 'wrap', padding: 5, gap: 5 },
  compartiment: {
    width: '31.6%',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  disque: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  nom: { fontSize: 10, fontWeight: '700', color: colors.text, textAlign: 'center', minHeight: 24 },
  pastille: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    paddingHorizontal: 3,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.blanc,
  },
  pastilleTexte: { color: colors.blanc, fontSize: 10, fontWeight: '800' },
});
