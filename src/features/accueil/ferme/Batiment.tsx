import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AncreBouton, EntreeDeColonne } from '@/features/accueil/ferme/typesFerme';
import { colors } from '@/shared/theme/colors';
import { useEchelle } from '@/shared/theme/miseEnPage';

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
  /** Collé aux limites de son parent (le cadre de la scène) : pas de bord sur les côtés ni en bas, le cadre aux coins arrondis le découpe. */
  colle?: boolean;
  /** La couleur des disques de tous les compartiments (le gris de l'atelier, le vert de l'agritourisme) ; absente : celle de chaque entrée. */
  couleurDisque?: string;
}

/** Le diamètre du disque d'un compartiment, à l'échelle 1 : celui du logo d'un intervenant. */
const DISQUE = 44;
/** La taille d'origine du dessin d'un bouton (celle de l'accueil) : le disque le met à son échelle. */
const TAILLE_DU_DESSIN = 30;

/** Un compartiment : une porte du bâtiment, avec son dessin et son nom. */
function Compartiment({
  entree,
  palette,
  onAppui,
  couleurDisque,
  seul,
}: {
  entree: EntreeDeColonne;
  palette: PaletteDeBatiment;
  onAppui: Props['onAppui'];
  couleurDisque?: string;
  seul?: boolean;
}) {
  const ref = useRef<View>(null);
  // Sur un grand écran (Windows), le dessin et le nom grandissent avec la largeur de la colonne.
  const e = useEchelle();
  // Le disque a la taille du logo d'un intervenant (50 à l'échelle 1, sans grandir au-delà) ; son dessin y occupe le tiers central. Le nom est à droite : le bâtiment garde sa hauteur.
  const disque = Math.round(DISQUE * Math.min(e, 1));
  const appuyer = () =>
    ref.current?.measureInWindow((x, y, largeur, hauteur) => onAppui(entree.cle, { x, y, largeur, hauteur }));
  return (
    <Pressable
      ref={ref}
      collapsable={false}
      style={[
        styles.compartiment,
        { backgroundColor: palette.compartiment, borderColor: palette.bord },
        styles.compartimentCompact,
        styles.compartimentLigne,
        seul ? styles.compartimentSeul : null,
        seul ? styles.compartimentSeulCompact : null,
      ]}
      onPress={appuyer}
      accessibilityRole="button"
      accessibilityLabel={entree.titre}
    >
      <View
        style={[
          styles.disque,
          {
            backgroundColor: couleurDisque ?? entree.couleur ?? palette.toit,
            width: disque,
            height: disque,
            borderRadius: disque / 2,
          },
        ]}
      >
        <View style={{ transform: [{ scale: (disque * 0.66) / TAILLE_DU_DESSIN }] }}>{entree.icone}</View>
        {entree.pastille ? (
          <View style={styles.pastille}>
            <Text style={styles.pastilleTexte}>{entree.pastille}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[
          styles.nom,
          styles.nomACote,
          { fontSize: Math.round(10 * e) },
        ]}
        numberOfLines={3}
      >
        {entree.titre}
      </Text>
    </Pressable>
  );
}

/**
 * Un grand bâtiment de la scène, dont les compartiments sont les menus de la gestion : la bergerie de l'exploitation, la fromagerie du travail du
 * produit. Un toit arrondi avec son nom, puis le mur et ses six portes, chacune avec son dessin et son nom : on touche directement celle qu'on veut.
 */
export function Batiment({
  titre,
  decor,
  entrees,
  onAppui,
  palette,
  surHauteur,
  couleurDisque,
  colle,
}: Props) {
  const echelle = useEchelle();
  return (
    <View style={styles.batiment} onLayout={(e) => surHauteur?.(Math.round(e.nativeEvent.layout.height))}>
      <View style={[styles.toit, { backgroundColor: palette.toit, height: Math.round(30 * echelle) }]}>
        <Text style={[styles.titre, { fontSize: Math.round(14 * echelle) }]}>{titre}</Text>
      </View>
      <View
        style={[
          styles.mur,
          { backgroundColor: palette.mur, borderColor: palette.toit },
          colle ? styles.murColle : null,
        ]}
      >
        {decor}
        <View style={[styles.compartiments, styles.compartimentsCompacts]}>
          {entrees.map((e, i) => (
            <Compartiment
              key={e.cle}
              entree={e}
              palette={palette}
              onAppui={onAppui}
              couleurDisque={couleurDisque}
              // Un compartiment seul sur sa rangée (le septième de l'atelier) prend toute la largeur.
              seul={i === entrees.length - 1 && entrees.length % 3 === 1}
            />
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
  murColle: { borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  // Une dernière rangée incomplète (cinq compartiments) se centre.
  compartiments: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 5, gap: 5 },
  compartiment: {
    width: '31.6%',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  // Sur tous les écrans : pas d'espace entre les compartiments, et la hauteur de leur contenu (le nom se lit sur autant de lignes qu'il en faut) ; le pré garde ainsi la place de ses textes.
  compartimentsCompacts: { padding: 0, gap: 0 },
  compartimentCompact: { width: '33.3333%', paddingVertical: 2, gap: 0 },
  compartimentSeulCompact: { width: '100%' },
  // Le dessin à gauche, le nom à droite (il passe sur autant de lignes qu'il en faut).
  compartimentLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 5, paddingHorizontal: 4 },
  nomACote: { flex: 1, textAlign: 'left' },
  compartimentSeul: {
    width: '98%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  disque: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  nom: { fontSize: 10, fontWeight: '700', color: colors.text, textAlign: 'center' },
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
